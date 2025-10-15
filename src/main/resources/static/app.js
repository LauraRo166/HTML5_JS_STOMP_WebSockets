var app = (function () {

    class Point{
        constructor(x,y){
            this.x=x;
            this.y=y;
        }        
    }
    
    var stompClient = null;

    var addPointToCanvas = function (point) {        
        var canvas = document.getElementById("canvas");
        var ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.arc(point.x, point.y, 1, 0, 2 * Math.PI);
        ctx.stroke();
    };
    
    
    var getMousePosition = function (evt) {
        canvas = document.getElementById("canvas");
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    };


    var connectAndSubscribe = function () {
        console.info('Connecting to WS...');
        var socket = new SockJS('/stompendpoint');
        stompClient = Stomp.over(socket);
        
        //subscribe to /topic/TOPICXX when connections succeed
        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);
            stompClient.subscribe('/topic/newpoint', function (message) {
                var receivedPoint = JSON.parse(message.body);
                var x = receivedPoint.x;
                var y = receivedPoint.y;
                alert(`Nuevo punto recibido:\nX: ${x}, Y: ${y}`);
                addPointToCanvas(receivedPoint);
            });
        });
    };
    
    

    return {

        init: function () {
            var can = document.getElementById("canvas");
            
            //websocket connection
            connectAndSubscribe();

            canvas.addEventListener("click", function (evt) {
                var pos = getMousePosition(evt);
                var pt = new Point(pos.x, pos.y);
                console.info("Enviando punto: " + JSON.stringify(pt));
                addPointToCanvas(pt);
                stompClient.send("/topic/newpoint", {}, JSON.stringify(pt));
            });
        },

        publishPoint: function(px,py){
            var pt=new Point(px,py);
            console.info("publishing point at "+ JSON.stringify(pt));

            addPointToCanvas(pt);

            stompClient.send("/topic/newpoint", {}, JSON.stringify(pt));
        },

        disconnect: function () {
            if (stompClient !== null) {
                stompClient.disconnect();
            }
            setConnected(false);
            console.log("Disconnected");
        }
    };

})();