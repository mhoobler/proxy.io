/**
 * Websocket client script. (Dependendant on socket.io.js)
 */

const socket = io('', {transports: ['websocket']});
socket.on('reload', () => console.log('reload'));
socket.on('change', () => {
  location.reload();
});
