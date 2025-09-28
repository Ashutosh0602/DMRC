let deferredPrompt;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;

  const installBanner = document.createElement("div");
  installBanner.id = "pwa-install-banner";
  installBanner.style =
    "position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: white; border-radius: 8px; padding: 12px 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.2); display: flex; align-items: center; gap: 12px; z-index: 9999;";

  installBanner.innerHTML = `
    <span style="font-size: 14px;">Install Geo Tracker for better experience</span>
    <button id="pwa-install-btn" style="padding: 6px 12px; background:#0070f3; color:white; border:none; border-radius:4px; cursor:pointer;">Install</button>
    <button id="pwa-install-cancel" style="padding: 6px 12px; background:#ccc; color:black; border:none; border-radius:4px; cursor:pointer;">Cancel</button>
  `;

  document.body.appendChild(installBanner);

  document.getElementById("pwa-install-btn").onclick = async () => {
    installBanner.remove();
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log("User response to install prompt:", outcome);
    deferredPrompt = null;
  };

  document.getElementById("pwa-install-cancel").onclick = () => {
    installBanner.remove();
  };
});
