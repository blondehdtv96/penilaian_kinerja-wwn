import { Server, Socket } from 'socket.io';

export const initSocketHandlers = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    socket.on('join:operator', (operatorId: number) => {
      socket.join(`operator:${operatorId}`);
      console.log(`Operator ${operatorId} joined room`);
    });

    socket.on('join:supervisor', () => {
      socket.join('supervisors');
      console.log(`Supervisor joined room`);
    });

    socket.on('join:hrd', () => {
      socket.join('hrd');
      console.log(`HRD joined room`);
    });

    socket.on('join:manager', () => {
      socket.join('managers');
      console.log(`Manager joined room`);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  // Helper functions to emit events
  const emitToOperator = (operatorId: number, event: string, data: any) => {
    io.to(`operator:${operatorId}`).emit(event, data);
  };

  const emitToRole = (role: string, event: string, data: any) => {
    io.to(role).emit(event, data);
  };

  return { emitToOperator, emitToRole };
};
