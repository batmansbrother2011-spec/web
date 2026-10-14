# Remote Desktop Setup Guide (noVNC on Oracle Cloud)

This guide walks you through setting up a **full Linux desktop** on your Oracle Cloud VM that you can access from **any web browser** (including iPad Safari). No apps to install on your device — just open a URL.

## What you'll get

- A full XFCE Linux desktop running on your Oracle VM
- Accessible from any web browser at `https://129.80.37.229:8443/vnc.html`
- Firefox browser pre-installed on the desktop (for browsing from the VM's IP)
- Password protected
- Encrypted connection (HTTPS)
- Works on iPad, iPhone, Mac, Windows, Android — anything with a browser

## Prerequisites

- Your Oracle Cloud VM is running (you already set this up earlier)
- You can SSH into the VM
- Port 8443 TCP is open in the Oracle Security List (instructions below)

## Step-by-step installation

### Step 1: SSH into your Oracle VM

From your local computer:

```bash
ssh -i ~/Downloads/ssh-key-2026-09-24.key ubuntu@129.80.37.229
```

### Step 2: Download the setup script

Once you're logged into the VM:

```bash
# Download the script
curl -fsSL https://raw.githubusercontent.com/batmansbrother2011-spec/web/main/scripts/oracle-vps/setup-novnc-desktop.sh -o setup-novnc-desktop.sh

# Make it executable
chmod +x setup-novnc-desktop.sh
```

**If the GitHub URL doesn't work** (rate limiting, etc.), you can create the file manually:

```bash
nano setup-novnc-desktop.sh
```

Then paste the entire script content from `scripts/oracle-vps/setup-novnc-desktop.sh` in the repo. Save with Ctrl+O → Enter → Ctrl+X.

### Step 3: Run the script

```bash
sudo bash setup-novnc-desktop.sh
```

The script will ask you to:
1. **Enter a password** — this is the password you'll use to log into the desktop from your browser. Use at least 6 characters.
2. Wait ~5 minutes while it installs XFCE4, TigerVNC, noVNC, and Firefox.

When it finishes, you'll see:
```
✓ Setup complete!

Access your desktop from any browser at:
  https://129.80.37.229:8443/vnc.html
```

### Step 4: Open port 8443 in Oracle Security List

**This is critical** — without this, your browser can't reach the desktop.

1. Go to [Oracle Cloud Console](https://cloud.oracle.com)
2. Hamburger menu → **Networking** → **Virtual Cloud Networks**
3. Click your VCN (named `Default` if you didn't change it)
4. Click **Security Lists** in the left sidebar
5. Click **Default Security List**
6. Click **Add Ingress Rules**
7. Fill in:
   - Source Type: CIDR
   - Source CIDR: `0.0.0.0/0`
   - IP Protocol: `TCP`
   - Destination Port Range: `8443`
   - Description: `noVNC web desktop`
8. Click **Add Ingress Rules**

### Step 5: Access the desktop from your iPad

1. Open **Safari** on your iPad
2. Go to: `https://129.80.37.229:8443/vnc.html`
3. You'll see a security warning — **this is normal** (self-signed SSL certificate)
4. Tap **Show Details** → **Visit this website** → **Visit website**
5. The noVNC login page appears
6. Enter the password you created in Step 3
7. Click **Connect**
8. You now have a full Linux desktop in your browser!

### Step 6: Using the desktop

- **Click** the top-left **Applications** menu for programs
- **Open Firefox** (Applications → Internet → Firefox) to browse the web
- The desktop runs at 1920x1080 — pinch-zoom to see it all on iPad
- **Copy/paste** between your iPad and the desktop: use the noVNC sidebar (left edge of screen) → Clipboard icon
- To **disconnect**, close the browser tab or click the disconnect button in the noVNC sidebar

## What you can do on the desktop

| Activity | How |
|----------|-----|
| Browse the web from the VM's IP | Open Firefox → visit any site |
| Play browser games (Krunker, etc.) | Firefox → go to the game site |
| Use the web proxy | Firefox → go to web-6v8l.vercel.app |
| Install Linux software | Open Terminal → `sudo apt install <package>` |
| File management | Applications → File Manager |
| Code/develop | `sudo apt install code` (VS Code) |

## Managing the desktop

### Stop the desktop (saves resources)
```bash
sudo systemctl stop novnc vncserver
```

### Start the desktop again
```bash
sudo systemctl start vncserver
sleep 2
sudo systemctl start novnc
```

### Restart the desktop (if it's glitchy)
```bash
sudo systemctl restart vncserver novnc
```

### Change the VNC password
```bash
vncpasswd
sudo systemctl restart vncserver novnc
```

### Change the desktop resolution
Edit the VNC service:
```bash
sudo nano /etc/systemd/system/vncserver.service
```

Find `-geometry 1920x1080` and change to your preferred resolution:
- `1280x720` — smaller, faster over slow networks
- `1920x1080` — full HD (default)
- `2560x1440` — high res (if your network can handle it)

Save (Ctrl+O → Enter → Ctrl+X), then:
```bash
sudo systemctl daemon-reload
sudo systemctl restart vncserver novnc
```

## Security notes

- The desktop is protected by your VNC password
- The connection is encrypted (HTTPS with self-signed cert)
- Only port 8443 is exposed — the VNC server (port 5901) only listens on localhost
- **Don't share the URL or password** with anyone you don't trust
- The desktop runs as `root` — be careful what you install

## Performance tips

- **Close unused apps** on the desktop to save RAM
- **Use 1280x720** resolution if the desktop is laggy
- **Use WiFi** instead of cellular data for better latency
- The VM is in Oracle's Washington DC region — closer = faster
- noVNC works well even on 10 Mbps connections

## Comparison: proxy vs remote desktop

| Feature | Web Proxy (Vercel) | Remote Desktop (Oracle VM) |
|---------|-------------------|---------------------------|
| Browse from different IP | ✅ | ✅ |
| Play browser games | ⚠️ (limited) | ✅ (full browser) |
| Log into sites (OAuth) | ❌ (breaks redirect_uri) | ✅ (real browser) |
| Install software | ❌ | ✅ |
| Works on iPad | ✅ | ✅ (Safari) |
| Setup time | Done | ~10 min |
| Cost | Free (Vercel) | Free (Oracle Always Free) |
