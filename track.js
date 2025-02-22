(function() {
    // Send tracking data
    fetch('/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            referrer: document.referrer,
            userAgent: navigator.userAgent,
            screenSize: screen.width + 'x' + screen.height,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        })
    });

    // Create a report button
    const btn = document.createElement("button");
    btn.innerText = "Report Issue";
    btn.style.position = "fixed";
    btn.style.bottom = "20px";
    btn.style.right = "20px";
    btn.style.padding = "10px";
    btn.style.background = "red";
    btn.style.color = "white";
    btn.style.border = "none";
    btn.style.cursor = "pointer";
    
    btn.onclick = function() {
        const message = prompt("Describe the issue:");
        if (message) {
            fetch('/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    referrer: document.referrer,
                    userAgent: navigator.userAgent,
                    screenSize: screen.width + 'x' + screen.height,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                })
            }).then(() => alert("Report submitted!"));
        }
    };

    document.body.appendChild(btn);
})();
