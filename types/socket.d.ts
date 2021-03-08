export declare type SocketColorType = 'normal' | 'exec';
export declare class Socket {
    name: string;
    data: unknown;
    compatible: Socket[];
    socketColor: string;
    socketType: SocketColorType;
    constructor(name: string, data?: {
        color: string;
        socketType: SocketColorType;
    });
    combineWith(socket: Socket): void;
    compatibleWith(socket: Socket): boolean;
}
