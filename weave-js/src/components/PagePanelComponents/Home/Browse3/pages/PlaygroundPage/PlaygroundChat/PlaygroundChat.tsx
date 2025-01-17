import {Box, CircularProgress, Divider} from '@mui/material';
import {MOON_200} from '@wandb/weave/common/css/color.styles';
import {Tailwind} from '@wandb/weave/components/Tailwind';
import React, {useState} from 'react';

import {CallChat} from '../../CallPage/CallChat';
import {TraceCallSchema} from '../../wfReactInterface/traceServerClientTypes';
import {PlaygroundContext} from '../PlaygroundContext';
import {PlaygroundState} from '../types';
import {PlaygroundCallStats} from './PlaygroundCallStats';
import {PlaygroundChatInput} from './PlaygroundChatInput';
import {PlaygroundChatTopBar} from './PlaygroundChatTopBar';
import {useChatCompletionFunctions} from './useChatCompletionFunctions';
import {
  SetPlaygroundStateFieldFunctionType,
  useChatFunctions,
} from './useChatFunctions';

export type PlaygroundChatProps = {
  entity: string;
  project: string;
  setPlaygroundStates: (states: PlaygroundState[]) => void;
  playgroundStates: PlaygroundState[];
  setPlaygroundStateField: SetPlaygroundStateFieldFunctionType;
  setSettingsTab: (callIndex: number | null) => void;
  settingsTab: number | null;
};

export const PlaygroundChat = ({
  entity,
  project,
  setPlaygroundStates,
  playgroundStates,
  setPlaygroundStateField,
  setSettingsTab,
  settingsTab,
}: PlaygroundChatProps) => {
  const [chatText, setChatText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const {handleRetry, handleSend} = useChatCompletionFunctions(
    setPlaygroundStates,
    setIsLoading,
    chatText,
    playgroundStates,
    entity,
    project,
    setChatText
  );

  const {deleteMessage, editMessage, deleteChoice, editChoice, addMessage} =
    useChatFunctions(setPlaygroundStateField);

  const handleAddMessage = (role: 'assistant' | 'user', text: string) => {
    for (let i = 0; i < playgroundStates.length; i++) {
      addMessage(i, {role, content: text});
    }
    setChatText('');
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
      <Box
        sx={{
          width: '100%',
          height: '100%',
          maxHeight: 'calc(100% - 130px)',
          display: 'flex',
          position: 'relative',
        }}>
        {isLoading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <CircularProgress />
          </Box>
        )}
        {playgroundStates.map((state, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && (
              <Divider
                orientation="vertical"
                flexItem
                sx={{
                  height: '100%',
                  borderRight: `1px solid ${MOON_200}`,
                }}
              />
            )}
            <Box
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
              }}>
              <Box
                sx={{
                  position: 'absolute',
                  top: '8px',
                  width: 'calc(100% - 16px)',
                  left: '8px',
                  right: '8px',
                  zIndex: 10,
                }}>
                <PlaygroundChatTopBar
                  idx={idx}
                  settingsTab={settingsTab}
                  setSettingsTab={setSettingsTab}
                  setPlaygroundStateField={setPlaygroundStateField}
                  setPlaygroundStates={setPlaygroundStates}
                  playgroundStates={playgroundStates}
                  entity={entity}
                  project={project}
                />
              </Box>
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  overflow: 'scroll',
                  paddingTop: '48px', // Height of the top bar
                  paddingX: '16px',
                }}>
                <Tailwind>
                  <div className=" mx-auto h-full min-w-[400px] max-w-[800px] pb-8">
                    {state.traceCall && (
                      <PlaygroundContext.Provider
                        value={{
                          isPlayground: true,
                          deleteMessage: (messageIndex, responseIndexes) =>
                            deleteMessage(idx, messageIndex, responseIndexes),
                          editMessage: (messageIndex, newMessage) =>
                            editMessage(idx, messageIndex, newMessage),
                          deleteChoice: choiceIndex =>
                            deleteChoice(idx, choiceIndex),
                          addMessage: newMessage => addMessage(idx, newMessage),
                          editChoice: (choiceIndex, newChoice) =>
                            editChoice(idx, choiceIndex, newChoice),
                          retry: (messageIndex: number, isChoice?: boolean) =>
                            handleRetry(idx, messageIndex, isChoice),
                          sendMessage: (
                            role: 'assistant' | 'user' | 'tool',
                            content: string,
                            toolCallId?: string
                          ) => {
                            handleSend(role, idx, content, toolCallId);
                          },
                        }}>
                        <CallChat call={state.traceCall as TraceCallSchema} />
                      </PlaygroundContext.Provider>
                    )}
                  </div>
                </Tailwind>
              </Box>
              <Box
                sx={{
                  width: '100%',
                  maxWidth: '800px',
                  padding: '8px',
                  paddingLeft: '12px',
                  marginX: 'auto',
                  marginBottom: '16px',
                }}>
                {state.traceCall.summary && (
                  <PlaygroundCallStats
                    call={state.traceCall as TraceCallSchema}
                  />
                )}
              </Box>
            </Box>
          </React.Fragment>
        ))}
      </Box>
      <PlaygroundChatInput
        chatText={chatText}
        setChatText={setChatText}
        isLoading={isLoading}
        onSend={handleSend}
        onAdd={handleAddMessage}
      />
    </Box>
  );
};
