# Troubleshooting Guide: noVNC Desktop

If the setup script didn't work or the desktop won't load, this guide covers every common issue.

## Quick diagnosis

SSH into your VM and run these commands to check what's wrong:

```bash
# Check if VNC server is running
sudo systemctl status vncserver

# Check if noVNC is running  
sudo systemctl status novnc

# Check if port 8443 is listening
sudo ss -tlnp | grep 8443

# Check if port 5901 is listening
sudo ss -tlnp | grep 5901

# Check recent logs
sudo journalctl -u vncserver -n 30 --no-pager
sudo journalctl -u novnc -n 30 --no-pager
```

## Table of Contents

1. [Can't access the URL (timeout / connection refused)](#1-cant-access-the-url)
2. [Security warning in browser](#2-security-warning-in-browser)
3. [noVNC connects but shows black screen](#3-black-screen)
4. [VNC server won't start](#4-vnc-server-wont-start)
5. [noVNC won't start](#5-novnc-wont-start)
6. [Desktop loads but is laggy/slow](#6-laggy-or-slow)
7. [Can't type / keyboard doesn't work](#7-keyboard-issues)
8. [Wrong resolution / desktop too big](#8-resolution-issues)
9. [Firefox won't launch](#9-firefox-wont-launch)
10. [Script fails during installation](#10-script-fails)
11. [Lost VNC password](#11-lost-password)
12. [Want to start over completely](#12-start-over)

---

## 1. Can't access the URL

### Symptom: Browser says "This site can't be reached" or "Connection timed out"

**Cause: Port 8443 is not open in the Oracle Security List.**

This is the #1 most common issue. The VM's iptables firewall is opened by the script, but Oracle's cloud-level firewall (Security List) must be opened manually.

**Fix:**

1. Go to [Oracle Cloud Console](https://cloud.oracle.com)
2. Hamburger menu → **Networking** → **Virtual Cloud Networks**
3. Click your VCN → **Security Lists** → **Default Security List**
4. Click **Add Ingress Rules**:
   - Source CIDR: `0.0.0.0/0`
   - IP Protocol: `TCP`
   - Destination Port Range: `8443`
   - Description: `noVNC web desktop`
5. Click **Add Ingress Rules**
6. Wait 10 seconds, then try the URL again

### Symptom: "Connection refused" (not timeout)

**Cause: noVNC service isn't running.**

**Fix:**
```bash
sudo systemctl start novnc
# Check if it's running
sudo systemctl status novnc
```

If it fails:
```bash
# Check the error
sudo journalctl -u novnc -n 20 --no-pager
```

Common fixes:
- Make sure VNC server is running first: `sudo systemctl start vncserver`
- Then start noVNC: `sudo systemctl start novnc`

---

## 2. Security warning in browser

### Symptom: "Your connection is not private" or "This certificate is not valid"

**This is normal and expected.** The SSL certificate is self-signed (we generated it ourselves, not from a Certificate Authority like Let's Encrypt).

**Fix:**

**On iPad (Safari):**
1. Tap **Show Details**
2. Tap **Visit this website**
3. Tap **Visit website**

**On Chrome (desktop):**
1. Click **Advanced**
2. Click **Proceed to 129.80.37.229 (unsafe)**

**On Firefox (desktop):**
1. Click **Advanced**
2. Click **Accept the Risk and Continue**

**If you want to remove the warning permanently** (optional, needs a domain):
1. Point a domain (e.g. `desktop.yourdomain.com`) to your VM's IP
2. Re-run the script with `--domain desktop.yourdomain.com`
3. The script will use Let's Encrypt for a real SSL certificate

---

## 3. Black screen

### Symptom: noVNC connects, but the screen is all black

**Cause: XFCE desktop didn't start properly.**

**Fix 1: Restart VNC server**
```bash
sudo systemctl restart vncserver
sleep 3
sudo systemctl restart novnc
```

**Fix 2: Check xstartup**
```bash
# Verify the xstartup file exists and is executable
ls -la /root/.vnc/xstartup

# If it's missing or not executable:
cat > /root/.vnc/xstartup << 'EOF'
#!/bin/sh
unset SESSION_MANAGER
unset DBUS_SESSION_BUS_ADDRESS
export XDG_SESSION_TYPE=x11
exec startxfce4
EOF
chmod +x /root/.vnc/xstartup

# Restart
sudo systemctl restart vncserver
sleep 3
sudo systemctl restart novnc
```

**Fix 3: Check VNC logs for errors**
```bash
cat /root/.vnc/*:1.log
```

Look for errors like "could not connect to display" or "xfce4 not found".

**Fix 4: Make sure XFCE is actually installed**
```bash
dpkg -l | grep xfce4
```

If nothing shows up:
```bash
sudo apt update
sudo apt install -y xfce4 xfce4-terminal
sudo systemctl restart vncserver
sleep 3
sudo systemctl restart novnc
```

---

## 4. VNC server won't start

### Symptom: `sudo systemctl status vncserver` shows "failed"

**Check the logs:**
```bash
sudo journalctl -u vncserver -n 50 --no-pager
```

### Common cause A: Password not set

```bash
# Set a new VNC password
vncpasswd
# Enter your password twice

# Restart
sudo systemctl restart vncserver
```

### Common cause B: Display already in use

```bash
# Kill any existing VNC sessions
vncserver -kill :1 2>/dev/null || true
vncserver -kill :2 2>/dev/null || true
vncserver -kill :3 2>/dev/null || true

# Clean up lock files
rm -f /tmp/.X1-lock /tmp/.X2-lock /tmp/.X3-lock /tmp/.X11-unix/X1 /tmp/.X11-unix/X2 /tmp/.X11-unix/X3

# Restart
sudo systemctl restart vncserver
```

### Common cause C: Out of memory

```bash
# Check available memory
free -h

# If available RAM is very low, kill unnecessary processes
sudo systemctl stop coturn  # Stop coturn if you don't need it right now
sudo systemctl restart vncserver
```

---

## 5. noVNC won't start

### Symptom: `sudo systemctl status novnc` shows "failed"

**Check the logs:**
```bash
sudo journalctl -u novnc -n 30 --no-pager
```

### Common cause A: websockify not installed

```bash
sudo apt install -y websockify novnc
sudo systemctl restart novnc
```

### Common cause B: noVNC files not in /usr/share/novnc

```bash
ls /usr/share/novnc/
```

If the directory is empty or doesn't exist:
```bash
# Install noVNC from GitHub
cd /tmp
curl -fsSL https://github.com/novnc/noVNC/archive/refs/tags/v1.4.0.tar.gz -o novnc.tar.gz
tar xzf novnc.tar.gz
sudo mkdir -p /usr/share/novnc
sudo cp -r noVNC-1.4.0/* /usr/share/novnc/
sudo systemctl restart novnc
```

### Common cause C: Port 8443 already in use

```bash
# Check what's using port 8443
sudo ss -tlnp | grep 8443

# Kill it if it's an old process
sudo kill $(sudo lsof -t -i:8443) 2>/dev/null || true
sudo systemctl restart novnc
```

---

## 6. Laggy or slow

### Symptom: Desktop works but is very laggy

**Fix 1: Lower the resolution**
```bash
sudo nano /etc/systemd/system/vncserver.service
# Change -geometry 1920x1080 to -geometry 1280x720
sudo systemctl daemon-reload
sudo systemctl restart vncserver novnc
```

**Fix 2: Lower the color depth**
```bash
sudo nano /etc/systemd/system/vncserver.service
# Change -depth 24 to -depth 16
sudo systemctl daemon-reload
sudo systemctl restart vncserver novnc
```

**Fix 3: Close unused apps on the desktop**
- Close Firefox tabs you're not using
- Close any terminal windows
- Each open app uses RAM and CPU

**Fix 4: Use WiFi instead of cellular**
- Cellular connections have higher latency
- WiFi is typically 2-3x faster for remote desktop

**Fix 5: Check VM load**
```bash
# Check CPU and RAM usage
top -n 1 | head -5
free -h

# If CPU is at 100%, something is using all the resources
# Find the process:
ps aux --sort=-%cpu | head -5
```

---

## 7. Keyboard issues

### Symptom: Can't type, or keys produce wrong characters

**Fix 1: Use the noVNC on-screen keyboard**
- In the noVNC sidebar (left edge of screen), tap the keyboard icon
- This opens a virtual keyboard at the bottom of the screen
- Use that to type

**Fix 2: Tap the desktop first**
- Sometimes the VNC window needs to be clicked/focused before keyboard input works
- Tap anywhere on the desktop, then try typing

**Fix 3: Check the noVNC settings**
- Click the gear icon in the noVNC sidebar
- Make sure "Show Dot when No Cursor" is checked
- Make sure "Local Scaling" is on

---

## 8. Resolution issues

### Symptom: Desktop is too big or too small

**Change resolution:**
```bash
sudo nano /etc/systemd/system/vncserver.service
# Find -geometry 1920x1080
# Change to one of:
#   -geometry 1280x720   (smaller, faster)
#   -geometry 1920x1080  (default, full HD)
#   -geometry 1024x768   (very small, very fast)

sudo systemctl daemon-reload
sudo systemctl restart vncserver novnc
```

**For iPad specifically:** 1280x720 fits well when you pinch-zoom to fit. 1920x1080 requires scrolling.

---

## 9. Firefox won't launch

### Symptom: Click Firefox icon but nothing happens

**Fix 1: Launch from terminal**
```bash
# Open a terminal on the desktop (Applications → Terminal Emulator)
# Then run:
firefox &
```

**Fix 2: Reinstall Firefox**
```bash
sudo apt update
sudo apt install --reinstall firefox
```

**Fix 3: Use Chromium instead**
```bash
sudo apt install -y chromium-browser
# Then find Chromium in Applications → Internet
```

**Fix 4: Check for error messages**
```bash
# In the desktop terminal, run:
firefox --no-remote 2>&1
```

This will print any error messages.

---

## 10. Script fails

### Symptom: Script stops with an error during installation

**Fix 1: Run apt update first**
```bash
sudo apt update
sudo apt upgrade -y
```

Then re-run the script.

**Fix 2: Fix broken packages**
```bash
sudo apt --fix-broken install
sudo dpkg --configure -a
sudo apt update
```

Then re-run the script.

**Fix 3: Run steps manually**

If the script fails at a specific step, you can run each step manually:

```bash
# Step 1: Install XFCE
sudo apt install -y xfce4 xfce4-terminal firefox

# Step 2: Install VNC
sudo apt install -y tigervnc-standalone-server
mkdir -p /root/.vnc
vncpasswd  # enter your password
cat > /root/.vnc/xstartup << 'EOF'
#!/bin/sh
unset SESSION_MANAGER
unset DBUS_SESSION_BUS_ADDRESS
exec startxfce4
EOF
chmod +x /root/.vnc/xstartup

# Step 3: Install noVNC
sudo apt install -y novnc websockify

# Step 4: Start VNC
vncserver :1 -geometry 1920x1080 -depth 24 -localhost yes

# Step 5: Start noVNC
websockify --web=/usr/share/novnc 8443 localhost:5901 &
```

Then access `https://129.80.37.229:8443/vnc.html`

---

## 11. Lost password

### Symptom: Can't remember the VNC password

**Fix: Reset it**
```bash
vncpasswd
# Enter new password twice

sudo systemctl restart vncserver
sleep 2
sudo systemctl restart novnc
```

---

## 12. Start over

### Symptom: Everything is broken and you want to start fresh

```bash
# Stop services
sudo systemctl stop novnc vncserver

# Remove VNC config
rm -rf /root/.vnc

# Remove installed packages (optional — only if you want a clean slate)
sudo apt remove -y --purge xfce4 xfce4-* tigervnc-* novnc websockify firefox
sudo apt autoremove -y

# Re-run the setup script
sudo bash setup-novnc-desktop.sh
```

---

## Still stuck?

If none of these fixes work, SSH into your VM and collect diagnostic info:

```bash
# System info
uname -a
cat /etc/os-release | head -3

# Memory
free -h

# Disk space
df -h / 

# Service status
systemctl status vncserver novnc

# Recent logs
journalctl -u vncserver -n 50 --no-pager
journalctl -u novnc -n 50 --no-pager

# Port status
ss -tlnp | grep -E '8443|5901'

# VNC log
cat /root/.vnc/*:1.log

# Installed packages
dpkg -l | grep -E 'xfce4|tigervnc|novnc|websockify|firefox'
```

Copy all the output and send it — I can diagnose from there.
