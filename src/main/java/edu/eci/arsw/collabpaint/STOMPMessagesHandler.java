package edu.eci.arsw.collabpaint;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import edu.eci.arsw.collabpaint.model.Point;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Controller
public class STOMPMessagesHandler {

    @Autowired
    SimpMessagingTemplate msgt;

    // Almacena los puntos por cada dibujo (thread-safe)
    private ConcurrentMap<String, List<Point>> drawingPoints = new ConcurrentHashMap<>();

    @MessageMapping("/newpoint.{numdibujo}")
    public void handlePointEvent(Point pt, @DestinationVariable String numdibujo) throws Exception {
        System.out.println("Nuevo punto recibido en el servidor!:" + pt);
        msgt.convertAndSend("/topic/newpoint." + numdibujo, pt);

        // Acumular puntos para el dibujo
        drawingPoints.putIfAbsent(numdibujo, new ArrayList<>());
        List<Point> points = drawingPoints.get(numdibujo);
        synchronized (points) {
            points.add(pt);
            if (points.size() >= 4) {
                Polygon polygon = new Polygon(new ArrayList<>(points));
                msgt.convertAndSend("/topic/newpolygon." + numdibujo, polygon);
                points.clear();
            }
        }
    }
}

// Clase para representar un polígono
class Polygon {
    private List<Point> points;

    public Polygon(List<Point> points) {
        this.points = points;
    }

    public List<Point> getPoints() {
        return points;
    }

    public void setPoints(List<Point> points) {
        this.points = points;
    }
}
