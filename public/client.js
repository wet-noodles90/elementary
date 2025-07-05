function ensureDependencies(){
  if(typeof window.jQuery === 'undefined' || typeof window.io === 'undefined'){
    console.log("Waiting till it loads. . . ")
    setTimeout(ensureDependencies, 50);
    return;
  }
  $(async function(){
    // Create container overlay
    window.elementary = true;
    const container = $('<div id="ele-container" style="position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9998"></div>').appendTo('body');
    const socket = io('wss://elementary-production.up.railway.app', { transports: ["websocket"] });
    const page = window.location.hostname + window.location.pathname;
    var textBoxShown = false

    var uuid = $('meta#ele-uuid').attr('ele-uuid');

    console.log(uuid)

    var blob = await fetch(`https://elementary-production.up.railway.app/user/player/${uuid}`, {
      mode: 'cors'
    });
    var info = await blob.json();

    // Player object
    const player = { x:20, y:20, rot:0, color: info.color || '#f00', name: info.displayName || 'Guest', messages: [] };
    socket.emit('join',{player,page});

    function render(list){
      container.empty();
      list.forEach(p=>{
        var latestmessage = (p.messages.length > 0) ? p.messages[p.messages.length - 1] : null;
        if (latestmessage && (Date.now() - latestmessage.timestamp) / 1000 <= 3) {
          console.log(JSON.stringify(latestmessage));
          const t = $(`<span>${latestmessage.content}</span>`);
          const m = $(`<div class="ele-message"></div>`).css({
            backgroundColor: '#ffffff', width: 7.2 * latestmessage.content.length, height: 22, position:'absolute',left:p.x - (7.2 * latestmessage.content.length) / 2, top:(p.y - 20 <= 0) ? p.y + 52 : p.y - 20
          });

          m.append(t);

          container.append(m);
        }
        const d = $(`<div class="ele-player"><span>${p.name}</span></div>`).css({
          width:32, height:32, background:p.color,
          position:'absolute', left:p.x, top:p.y,
          transform:`rotate(${p.rot}deg)`
        });
        container.append(d);
      });
    }
    socket.on('update', render);

    function showTextBox() {
      const box = $('<input type="text" id="message" placeholder="Type something. . .">').css({
        width:window.innerWidth - 20, height:50, background:'#808080',
        position:'fixed', top:window.innerHeight - 80, left:20, color:'#ffffff', zIndex:9999
      });

      box.appendTo('body');

      textBoxShown = true;
    }

    function hideTextBoxAndSend() {
      var messageBox = $('input#message');

      var content = messageBox.val();

      var message = { content: content, timestamp: Date.now() };

      player.messages.push(message);

      socket.emit('message', player);

      messageBox.remove();
      textBoxShown = false;
    }

    // Movement keys
    const keysDown = {};

    // Listen for key presses/releases
    $(document)
      .on('keydown', e => { keysDown[e.key] = true; })
      .on('keyup',   e => { delete keysDown[e.key]; });

    // Your game loop: called ~60×/sec
    function gameLoop() {

      // Rotation: A/D or ArrowLeft/ArrowRight
      if ((keysDown['a'] || keysDown['ArrowLeft']) && !textBoxShown) {
        player.rot -= 5;   // degrees per frame
      }
      if ((keysDown['d'] || keysDown['ArrowRight']) && !textBoxShown) {
        player.rot += 5;
      }

      // Forward/back along facing direction: W/S or ArrowUp/ArrowDown
      const rad = ((player.rot - 90) % 360) * Math.PI / 180;
      if ((keysDown['w'] || keysDown['ArrowUp']) && !textBoxShown) {
        player.x += Math.cos(rad) * 5;  // pixels per frame
        player.y += Math.sin(rad) * 5;
      }
      if ((keysDown['s'] || keysDown['ArrowDown']) && !textBoxShown) {
        player.x -= Math.cos(rad) * 5;
        player.y -= Math.sin(rad) * 5;
      }

      if (keysDown['t'] && !textBoxShown) {
        showTextBox();
      } else if (keysDown['Enter'] && textBoxShown) {
        hideTextBoxAndSend();
      }

      socket.emit('move', player);

      // Schedule next frame
      requestAnimationFrame(gameLoop);
    }

    gameLoop();

    window.addEventListener('beforeunload', e=>{
      socket.emit('disconnect');
    });
  });
};

ensureDependencies();