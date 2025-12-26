# Running Framed TV as a Systemd Service (Docker)

This guide links the `framed-tv` Docker container to a systemd user service. This ensures the application starts on boot, restarts on failure, and manages logs cleanly.

## 1. Key design decisions

*   **Systemd manages Docker**: We use systemd to start/stop the *container*, not the Node process directly.
*   **No local dependencies**: We don't need `npm` or `node` installed on the host for this to run.
*   **Robustness**: Systemd handles restart policies (e.g., if the daemon crashes).

## 2. Create the systemd service file

Create the service file in your user configuration directory:

```bash
mkdir -p ~/.config/systemd/user
nano ~/.config/systemd/user/framed-tv.service
```

Paste the following configuration:

```ini
[Unit]
Description=Framed TV (Docker)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple

# Clean up any previous container with the same name to avoid conflicts
ExecStartPre=/usr/bin/docker rm -f framed-tv || true

# Run container
# -p 1507:1507 maps the port
# --name framed-tv gives it a predictable name for commands
ExecStart=/usr/bin/docker run \
  --name framed-tv \
  -p 1507:1507 \
  eddiegulled/framed-tv:latest

# Stop container cleanly when service stops
ExecStop=/usr/bin/docker stop framed-tv

# Restart if it crashes
Restart=on-failure
RestartSec=5

# Prevent systemd from interfering with Docker's process management
KillMode=none

[Install]
WantedBy=default.target
```

## 3. Enable and Start the Service

Reload the systemd manager configuration to recognize the new service:

```bash
systemctl --user daemon-reload
```

Start the service immediately:

```bash
systemctl --user start framed-tv
```

Enable it to start automatically on login/boot:

```bash
systemctl --user enable framed-tv
```

## 4. Manage the Service

Check the status:

```bash
systemctl --user status framed-tv
```

Restart (pulls new image only if you changed the ExecStart to use `--pull=always`, otherwise just restarts container):

```bash
systemctl --user restart framed-tv
```

Stop the service:

```bash
systemctl --user stop framed-tv
```

## 5. View Logs

You can view logs via systemd (journalctl) OR Docker.

**Via Systemd (Recommended):**
```bash
journalctl --user -u framed-tv -f
```

**Via Docker:**
```bash
docker logs -f framed-tv
```
