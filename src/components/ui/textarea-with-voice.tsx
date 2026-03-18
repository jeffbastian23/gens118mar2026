import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import VoiceInput from "@/components/VoiceInput";
import { cn } from "@/lib/utils";

export interface TextareaWithVoiceProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  onVoiceTranscript?: (text: string) => void;
}

const TextareaWithVoice = React.forwardRef<HTMLTextAreaElement, TextareaWithVoiceProps>(
  ({ className, onVoiceTranscript, value, onChange, ...props }, ref) => {
    const handleTranscript = (text: string) => {
      if (onVoiceTranscript) {
        onVoiceTranscript(text);
      } else if (onChange) {
        const event = {
          target: { value: (value as string || "") + " " + text }
        } as React.ChangeEvent<HTMLTextAreaElement>;
        onChange(event);
      }
    };

    return (
      <div className="relative">
        <Textarea
          className={cn("pr-12", className)}
          ref={ref}
          value={value}
          onChange={onChange}
          {...props}
        />
        <VoiceInput 
          onTranscript={handleTranscript}
          className="absolute top-2 right-2"
        />
      </div>
    );
  }
);
TextareaWithVoice.displayName = "TextareaWithVoice";

export { TextareaWithVoice };
