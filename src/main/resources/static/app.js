var app = (function () {

    class Point {
        constructor(x, y) {
            this.x = x;
            this.y = y;
        }
    }

    var stompClient = null;
    var drawingId = null;

    var addPointToCanvas = function (point) {
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
        ctx.stroke();
    };

    var getMousePosition = function (evt) {
        var canvas = document.getElementById("canvas");
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    };

    var connectAndSubscribe = function () {
        console.info('Conectando a WebSocket...');
        var socket = new SockJS('/stompendpoint');
        stompClient = Stomp.over(socket);

        stompClient.connect({}, function (frame) {
            console.log('Conectado: ' + frame);

            var topic = `/topic/newpoint.${drawingId}`;
            stompClient.subscribe(topic, function (message) {
                var receivedPoint = JSON.parse(message.body);
                console.log(`Punto recibido en ${topic}:`, receivedPoint);
                addPointToCanvas(receivedPoint);
            });

            // Suscribirse al tópico de polígonos
            var polygonTopic = `/topic/newpolygon.${drawingId}`;
            stompClient.subscribe(polygonTopic, function (message) {
                var polygonObj = JSON.parse(message.body);
                if (polygonObj.points && polygonObj.points.length > 0) {
                    drawPolygon(polygonObj.points);
                }
            });

            console.log(`Suscrito a ${topic} y a ${polygonTopic}`);
        });
    };

    // Dibuja un polígono en el canvas dado un arreglo de puntos
    var drawPolygon = function (points) {
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        if (points.length < 3) return;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (var i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.closePath();
        ctx.fillStyle = "rgba(0, 150, 255, 0.3)";
        ctx.fill();
        ctx.strokeStyle = "#0033cc";
        ctx.lineWidth = 2;
        ctx.stroke();
    };

    return {

        connect: function () {
            drawingId = document.getElementById("drawingId").value;
            if (!drawingId) {
                alert("Por favor, ingrese un ID de dibujo.");
                return;
            }

            console.info(`Conectando al dibujo ${drawingId}...`);
            connectAndSubscribe();

            var canvas = document.getElementById("canvas");
            canvas.addEventListener("click", function (evt) {
                var pos = getMousePosition(evt);
                var pt = new Point(pos.x, pos.y);
                console.info(`Enviando punto a ${drawingId}: `, pt);

                addPointToCanvas(pt);

                var topic = `/topic/newpoint.${drawingId}`;
                // Ahora se publica el punto en /app/newpoint.{numdibujo} para que lo procese el servidor
                var appTopic = `/app/newpoint.${drawingId}`;
                stompClient.send(appTopic, {}, JSON.stringify(pt));
            });
        },

        disconnect: function () {
            if (stompClient !== null) {
                stompClient.disconnect();
            }
            console.log("Desconectado");
        }
    };

})();