'use client'

import { useRive, useStateMachineInput } from '@rive-app/react-canvas';
import { useEffect, useRef } from 'react';

interface LipSyncCharacterProps {
  text: string;
}

export function LipSyncCharacter({ text }: LipSyncCharacterProps) {
  const { rive, RiveComponent } = useRive({
    src: '/cat.riv',
    stateMachines: 'State Machine 1',
    autoplay: true,
  });

  const talkInput = useStateMachineInput(rive, 'State Machine 1', 'talk');
  const textRef = useRef(text);

  useEffect(() => {
    textRef.current = text;
  }, [text]);

  useEffect(() => {
    if (!talkInput) return;

    let timeoutId: NodeJS.Timeout;
    const simulateTalking = () => {
      if (textRef.current.length > 0) {
        talkInput.fire();
        timeoutId = setTimeout(simulateTalking, 200);
      } else {
        // No action needed if stop is not available
      }
    };

    simulateTalking();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [talkInput]);

  return (
    <div className="w-full h-64">
      <RiveComponent className="w-full h-full" />
    </div>
  );
}

