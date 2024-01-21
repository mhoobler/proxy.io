const socket = io.connect("", { transports: ["websocket"] });
socket.on("test", (message) => {
  console.log(message);
});
socket.on("change", () => {
  location.reload();
});
console.log("helloWorld");
