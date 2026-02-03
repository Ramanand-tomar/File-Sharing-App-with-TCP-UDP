import { produce } from 'immer';
import { Alert } from 'react-native';
import { useChunkStore } from '../db/chunkStore';
import { Buffer } from 'buffer';

export const receiveFileAck = async (
  data: any,
  socket: any,
  setReceivedFiles: any,
): Promise<void> => {
  const { setChunkStore, chunkStore } = useChunkStore.getState();

  if (chunkStore) {
    Alert.alert('there are files which need to be received wait bro!');
    return;
  }

  setReceivedFiles((prevFiles: any) =>
    produce(prevFiles, (draft: any) => {
      draft.push(data);
    }),
  );

  setChunkStore({
    id:data?.id,
    totalChunks : data?.totalChunks,
    name: data?.name,
    size: data?.size,
    mimeType: data?.mimeType,
    chunkArray: []
  })

  if(!socket){
    console.log("socket not available");
  }

  try {
    await new Promise((resolve) => setTimeout(resolve , 10));
    console.log("File Received Acknowledged");
    socket.write(JSON.stringify({ event:'send_chunk_ack' , chunkNo:0 }));
    console.log("requested for first chunk");
  } catch (error) {
    console.error("Error sending file ", error);
    
  }



};

export const sendChunkAck = async (
  chunkIndex: any,
  socket: any,
  setTotalSendBytes: any,
  setSentFiles: any,
): Promise<void> => {
    const { currentChunkSet , resetCurrentChunkSet } = useChunkStore.getState();

    if(!currentChunkSet){
      Alert.alert('there are no chunks to be sent');
      return;
    }

    if(!socket){
        console.log("socket not available");
    }

    const totalChunks = currentChunkSet.totalChunks;

    try {
        await new Promise((resolve) => setTimeout(resolve , 10));
        socket.write(
            JSON.stringify({
                event: 'received_chunk_ack',
                chunkNo: chunkIndex,
                chunk: currentChunkSet?.chunkArray[chunkIndex].toString('base64'),
            }),
        )
        setTotalSendBytes((prevBytes:number) => prevBytes + currentChunkSet?.chunkArray[chunkIndex].length);

        if (chunkIndex+2 > totalChunks) {
            console.log('File Sent Successfully');
            setSentFiles((prevFiles: any) =>
                produce(prevFiles, (draft: any) => {
                    const fileIndex = draft.findIndex((file: any) => file.id === currentChunkSet.id);
                    if (fileIndex !== -1) {
                        draft[fileIndex].available = true;
                    }
                }),
            );
            resetCurrentChunkSet();
        }



    } catch (error) {
        console.log("Error sending chunk ", error);
        
    }



};

export const receivedChunkAck = async (
  chunk: any,
  chunkNo: any,
  socket: any,
  setTotalReceivedBytes: any,
  generateFile: any,
): Promise<void> => {

  const { chunkStore , resetChunkStore, setChunkStore } = useChunkStore.getState();

  if(!chunkStore){
    Alert.alert('there are no chunks to be received');
    return;
  }

  try {
    
    const bufferChunk = Buffer.from(chunk, 'base64');
    const updateChunkArray = [...(chunkStore.chunkArray || [])]
    updateChunkArray[chunkNo] = bufferChunk;
    setChunkStore({ ...chunkStore, chunkArray: updateChunkArray });
    setTotalReceivedBytes((prevBytes:number) => prevBytes + bufferChunk.length);



    
  } catch (error) {
    console.log("Error sending chunk ", error);
    
  }

  if(!socket){
    console.log("socket not available");
    return;
  }

  if(chunkNo + 1 === chunkStore?.totalChunks){
    console.log('File Received Successfully');
    generateFile();
    resetChunkStore();
    return;
  }

  try {
    await new Promise((resolve) => setTimeout(resolve , 10));
    console.log("requested for next chunk" , chunkNo+1);
    socket.write(JSON.stringify({ event:'send_chunk_ack' , chunkNo:chunkNo+1 }));
    
  } catch (error) {
    console.log("Error sending chunk ", error);
    
  }

  



};
