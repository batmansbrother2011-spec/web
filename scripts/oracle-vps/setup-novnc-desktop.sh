#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════════════════
# noVNC Desktop Setup Script for Oracle Cloud (or any Ubuntu/Debian VPS)
#
# This script installs:
#   1. XFCE4 desktop environment (lightweight, fast over network)
#   2. TigerVNC server (the VNC backend)
#   3. noVNC (web-based VNC client — access desktop from any browser)
#   4. Firefox browser (pre-installed on the desktop)
#   5. Self-signed HTTPS certificate (encrypted connection)
#   6. Password protection (only you can access the desktop)
#
# After running this script, access your desktop from any web browser at:
#   https://YOUR_VM_IP:8443/vnc.html
#
# Run on the VPS as root (or with sudo):
#   sudo bash setup-novnc-desktop.sh
#
# ════════════════════════════════════════════════════════════════════════════

set -euo pipefail

# ── Colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  noVNC Desktop Setup for Oracle Cloud VPS                 ${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

# ── Check if running as root ────────────────────────────────────────────────
if [[ $EUID -ne 0 ]]; then
   echo -e "${YELLOW}→ Running with sudo...${NC}"
   exec sudo bash "$0" "$@"
fi

# ── Get VNC password ────────────────────────────────────────────────────────
VNC_PASSWORD=""
while [[ -z "$VNC_PASSWORD" ]]; do
  read -sp "Enter a password for your desktop (min 6 chars): " VNC_PASSWORD
  echo ""
  if [[ ${#VNC_PASSWORD} -lt 6 ]]; then
    echo -e "${RED}Password too short. Use at least 6 characters.${NC}"
    VNC_PASSWORD=""
  fi
done
echo ""

# ── Get public IP ────────────────────────────────────────────────────────────
PUBLIC_IP=$(curl -s https://api.ipify.org 2>/dev/null || curl -s https://ifconfig.me 2>/dev/null || echo "YOUR_VM_IP")
echo -e "${GREEN}→ Detected public IP: ${PUBLIC_IP}${NC}"
echo ""

# ── Step 1: System update ───────────────────────────────────────────────────
echo -e "${YELLOW}→ Step 1/6: Updating system packages...${NC}"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq 2>&1 | tail -1
apt-get upgrade -y -qq 2>&1 | tail -1
echo -e "${GREEN}  ✓ System updated${NC}"
echo ""

# ── Step 2: Install XFCE4 desktop ──────────────────────────────────────────
echo -e "${YELLOW}→ Step 2/6: Installing XFCE4 desktop environment...${NC}"
echo -e "${YELLOW}  (This takes 3-5 minutes — installing ~500 packages)${NC}"
DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
  xfce4 xfce4-terminal xfce4-goodies \
  firefox \
  dbus-x11 \
  x11-xserver-utils \
  2>&1 | tail -5
echo -e "${GREEN}  ✓ XFCE4 desktop installed${NC}"
echo ""

# ── Step 3: Install TigerVNC server ────────────────────────────────────────
echo -e "${YELLOW}→ Step 3/6: Installing TigerVNC server...${NC}"
DEBIAN_FRONTEND=noninteractive apt-get install -y -qq tigervnc-standalone-server tigervnc-common 2>&1 | tail -3

# Set VNC password
mkdir -p /root/.vnc
echo "$VNC_PASSWORD" | vncpasswd -f > /root/.vnc/passwd
chmod 600 /root/.vnc/passwd

# Create VNC xstartup config
cat > /root/.vnc/xstartup << 'EOF'
#!/bin/sh
unset SESSION_MANAGER
unset DBUS_SESSION_BUS_ADDRESS
export XDG_SESSION_TYPE=x11
exec startxfce4
EOF
chmod +x /root/.vnc/xstartup

echo -e "${GREEN}  ✓ TigerVNC server installed and configured${NC}"
echo ""

# ── Step 4: Install noVNC ───────────────────────────────────────────────────
echo -e "${YELLOW}→ Step 4/6: Installing noVNC (web-based VNC client)...${NC}"

# Install prerequisites
DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
  novnc \
  websockify \
  python3-numpy \
  2>&1 | tail -3

# If novnc package isn't available, install from GitHub
if [[ ! -d /usr/share/novnc ]]; then
  echo -e "${YELLOW}  noVNC not in apt — downloading from GitHub...${NC}"
  cd /tmp
  curl -fsSL https://github.com/novnc/noVNC/archive/refs/tags/v1.4.0.tar.gz -o novnc.tar.gz
  tar xzf novnc.tar.gz
  mkdir -p /usr/share/novnc
  cp -r noVNC-1.4.0/* /usr/share/novnc/
  rm -rf noVNC-1.4.0 novnc.tar.gz
fi

echo -e "${GREEN}  ✓ noVNC installed${NC}"
echo ""

# ── Step 5: Generate SSL certificate ────────────────────────────────────────
echo -e "${YELLOW}→ Step 5/6: Generating SSL certificate...${NC}"
mkdir -p /root/.vnc/ssl
openssl req -x509 -nodes -newkey rsa:2048 \
  -keyout /root/.vnc/ssl/novnc.key \
  -out /root/.vnc/ssl/novnc.crt \
  -days 3650 \
  -subj "/CN=${PUBLIC_IP}" \
  2>/dev/null
echo -e "${GREEN}  ✓ SSL certificate generated (valid for 10 years)${NC}"
echo ""

# ── Step 6: Create systemd services ─────────────────────────────────────────
echo -e "${YELLOW}→ Step 6/6: Creating system services...${NC}"

# VNC server service (runs on display :1 = port 5901)
cat > /etc/systemd/system/vncserver.service << EOF
[Unit]
Description=TigerVNC server for XFCE desktop
After=network.target

[Service]
Type=forking
User=root
ExecStartPre=/bin/sh -c '/usr/bin/vncserver -kill :1 > /dev/null 2>&1 || :'
ExecStart=/usr/bin/vncserver :1 -geometry 1920x1080 -depth 24 -localhost yes
ExecStop=/usr/bin/vncserver -kill :1
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# noVNC web proxy service (serves the VNC connection over HTTPS on port 8443)
cat > /etc/systemd/system/novnc.service << EOF
[Unit]
Description=noVNC web client (HTTPS)
After=vncserver.service
Requires=vncserver.service

[Service]
Type=simple
ExecStart=/usr/bin/websockify --web=/usr/share/novnc 8443 localhost:5901 --cert=/root/.vnc/ssl/novnc.crt --key=/root/.vnc/ssl/novnc.key
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Enable and start services
systemctl daemon-reload
systemctl enable vncserver.service
systemctl enable novnc.service
systemctl restart vncserver.service
sleep 2
systemctl restart novnc.service
sleep 2

echo -e "${GREEN}  ✓ Services created and started${NC}"
echo ""

# ── Open iptables firewall ──────────────────────────────────────────────────
echo -e "${YELLOW}→ Opening firewall ports...${NC}"
iptables -I INPUT -p tcp --dport 8443 -j ACCEPT 2>/dev/null || true
iptables -I INPUT -p tcp --dport 5901 -j ACCEPT 2>/dev/null || true
netfilter-persistent save 2>/dev/null || true
echo -e "${GREEN}  ✓ Firewall ports opened (8443, 5901)${NC}"
echo ""

# ── Verify services are running ─────────────────────────────────────────────
VNC_STATUS=$(systemctl is-active vncserver.service || echo "failed")
NOVNC_STATUS=$(systemctl is-active novnc.service || echo "failed")

echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""
if [[ "$VNC_STATUS" == "active" && "$NOVNC_STATUS" == "active" ]]; then
  echo -e "${GREEN}✓ Setup complete!${NC}"
  echo ""
  echo -e "Access your desktop from any browser at:"
  echo -e "${GREEN}  https://${PUBLIC_IP}:8443/vnc.html${NC}"
  echo ""
  echo -e "VNC password: ${YELLOW}(the password you entered above)${NC}"
  echo ""
  echo -e "${YELLOW}⚠  Your browser will show a security warning because the SSL${NC}"
  echo -e "${YELLOW}   certificate is self-signed. Click 'Advanced' → 'Proceed' to continue.${NC}"
  echo ""
  echo -e "To stop the desktop:  ${BLUE}sudo systemctl stop novnc vncserver${NC}"
  echo -e "To restart the desktop: ${BLUE}sudo systemctl restart vncserver novnc${NC}"
  echo -e "To change the password: ${BLUE}vncpasswd${NC}"
else
  echo -e "${RED}✗ One or more services failed to start.${NC}"
  echo ""
  echo "VNC server status: $VNC_STATUS"
  echo "noVNC status: $NOVNC_STATUS"
  echo ""
  echo "Check the logs:"
  echo "  sudo journalctl -u vncserver -n 30 --no-pager"
  echo "  sudo journalctl -u novnc -n 30 --no-pager"
fi
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"

# ── Reminder about Oracle Security List ─────────────────────────────────────
echo ""
echo -e "${YELLOW}⚠  IMPORTANT: Open port 8443 (TCP) in the Oracle Cloud Security List!${NC}"
echo -e "${YELLOW}   Without this, your browser can't reach noVNC.${NC}"
echo ""
echo -e "Oracle Console → Networking → VCN → Security Lists → Default"
echo -e "→ Add Ingress Rule:"
echo -e "   Source CIDR: 0.0.0.0/0"
echo -e "   IP Protocol: TCP"
echo -e "   Destination Port Range: 8443"
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
