
document.addEventListener('DOMContentLoaded', function() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('/service-worker.js')
          .then(function(registration) {
            console.log('Service Worker registrato con successo con scope: ', registration.scope);

            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              console.log('Trovato nuovo Service Worker:', newWorker);

              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  showUpdateNotification();
                }
              });
            });
          })
          .catch(function(error) {
            console.error('Registrazione del Service Worker fallita:', error);
          });

        setInterval(() => {
          navigator.serviceWorker.getRegistration().then(registration => {
            if (registration) registration.update();
          });
        }, 60 * 60 * 1000); // 1 h
      });
      
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    } else {
      console.log('I Service Worker non sono supportati in questo browser');
    }
    
    let deferredPrompt;
    
    window.addEventListener('beforeinstallprompt', (e) => {

      e.preventDefault();
      deferredPrompt = e;
      showInstallButton();
    });
    
    function showInstallButton() {
      const installButton = document.createElement('button');
      installButton.id = 'installButton';
      installButton.textContent = 'Installa SILVI';
      installButton.className = 'install-button';
      
      installButton.style.position = 'fixed';
      installButton.style.bottom = '20px';
      installButton.style.left = '50%';
      installButton.style.transform = 'translateX(-50%)';
      installButton.style.backgroundColor = '#00aa00';
      installButton.style.color = '#000000';
      installButton.style.padding = '10px 20px';
      installButton.style.borderRadius = '5px';
      installButton.style.border = 'none';
      installButton.style.fontFamily = 'retropix';
      installButton.style.fontSize = '16px';
      installButton.style.zIndex = '1001';
      installButton.style.cursor = 'pointer';
      
      document.body.appendChild(installButton);
      
      installButton.addEventListener('click', async () => {
        installButton.style.display = 'none';
        
        deferredPrompt.prompt();
        
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`Scelta dell'utente: ${outcome}`);
        
        deferredPrompt = null;
      });
    }
    
    function showUpdateNotification() {
      const notification = document.createElement('div');
      notification.className = 'update-notification';
      notification.innerHTML = `
        <div class="update-content">
          <p>È disponibile un nuovo aggiornamento!</p>
          <button id="updateButton">Aggiorna ora</button>
        </div>
      `;
      
      notification.style.position = 'fixed';
      notification.style.top = '20px';
      notification.style.left = '50%';
      notification.style.transform = 'translateX(-50%)';
      notification.style.backgroundColor = 'rgba(0, 170, 0, 0.9)';
      notification.style.color = '#000000';
      notification.style.padding = '10px 20px';
      notification.style.borderRadius = '5px';
      notification.style.zIndex = '1002';
      notification.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
      const buttonStyle = document.createElement('style');
      buttonStyle.textContent = `
        .update-notification button {
          background-color: #004400;
          color: #ffffff;
          border: none;
          padding: 5px 15px;
          margin-top: 10px;
          border-radius: 3px;
          cursor: pointer;
          font-family: 'retropix', sans-serif;
        }
        
        .update-notification button:hover {
          background-color: #006600;
        }
      `;
      document.head.appendChild(buttonStyle);
      
      document.body.appendChild(notification);
      
      document.getElementById('updateButton').addEventListener('click', () => {
        navigator.serviceWorker.getRegistration().then(registration => {
          if (registration.waiting) {
            registration.waiting.postMessage({ action: 'skipWaiting' });
          }
        });
        
        document.body.removeChild(notification);
      });
    }
  });