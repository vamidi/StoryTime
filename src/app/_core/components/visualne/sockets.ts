import { Socket } from 'visualne';

export const numSocket = new Socket( 'Number value', '#8e44ad', { socketType: 'exec' });
// export const textSocket = new CustomSocket('#fff', 'Text value');

// Quest sockets
const normalOut = 'normal';
export const dialogueSocket = new Socket('Dialogue Value', '#8e44ad', { socketType: normalOut });
export const dialogueOptionSocket = new Socket( 'Dialogue Option Value', '#47EBE0', { socketType: normalOut });

// Dialogues can only combine with dialogues
dialogueSocket.combineWith(dialogueSocket);

// Dialogue Options can combine itself with a Dialogue
dialogueOptionSocket.combineWith(dialogueSocket);
// dialogueOptionSocket.combineWith(dialogueOptionSocket);

// dialogueSocket.combineWith(anySocket);
// dialogueOptionSocket.combineWith(anySocket);
// anySocket.combineWith(dialogueSocket);
// anySocket.combineWith(dialogueOptionSocket);

