import * as React from "react";
import { Input } from "@/components/ui/input";
import VoiceInput from "@/components/VoiceInput";
import { cn } from "@/lib/utils";

export interface InputWithVoiceProps extends React.ComponentProps<"input"> {
  onVoiceTranscript?: (text: string) => void;
}

const InputWithVoice = React.forwardRef<HTMLInputElement, InputWithVoiceProps>(
  ({ className, onVoiceTranscript, value, onChange, ...props }, ref) => {
    const handleTranscript = (text: string) => {
      if (onVoiceTranscript) {
        onVoiceTranscript(text);
      } else if (onChange) {
        const event = {
          target: { value: (value as string || "") + " " + text }
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(event);
      }
    };

    return (
      <div className="relative flex items-center gap-2">
        <Input
          className={cn("pr-12", className)}
          ref={ref}
          value={value}
          onChange={onChange}
          {...props}
        />
        <VoiceInput 
          onTranscript={handleTranscript}
          className="absolute right-2"
        />
      </div>
    );
  }
);
InputWithVoice.displayName = "InputWithVoice";

export { InputWithVoice };
