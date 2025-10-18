/**
 * Voice Recorder - WhatsApp style voice message
 */
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, X, Send, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buttonPress, messageBubble } from "@/lib/animations";
import { toast } from "sonner";

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void;
  maxDuration?: number; // seconds
}

export function VoiceRecorder({ 
  onRecordingComplete, 
  maxDuration = 300 
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioURL) URL.revokeObjectURL(audioURL);
    };
  }, [audioURL]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        onRecordingComplete(blob, duration);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration(prev => {
          const next = prev + 1;
          if (next >= maxDuration) {
            stopRecording();
            return prev;
          }
          return next;
        });
      }, 1000);
    } catch (err) {
      toast.error("无法访问麦克风");
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setDuration(prev => Math.min(prev + 1, maxDuration));
      }, 1000);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
    setIsRecording(false);
    setIsPaused(false);
    setDuration(0);
    chunksRef.current = [];
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-2">
      <AnimatePresence mode="wait">
        {!isRecording ? (
          <motion.div
            key="start"
            variants={buttonPress}
            whileHover="hover"
            whileTap="tap"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={startRecording}
              className="h-9 w-9 text-blue-600"
            >
              <Mic className="h-5 w-5" />
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="recording"
            variants={messageBubble}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="flex items-center gap-3 bg-red-50 dark:bg-red-950/20 px-4 py-2 rounded-full"
          >
            {/* Animated Recording Indicator */}
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.6, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="h-3 w-3 bg-red-500 rounded-full"
            />

            {/* Duration */}
            <span className="text-sm font-mono font-semibold text-red-600 dark:text-red-400">
              {formatTime(duration)}
            </span>

            {/* Controls */}
            <div className="flex gap-1">
              <motion.div variants={buttonPress} whileTap="tap">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={isPaused ? resumeRecording : pauseRecording}
                >
                  {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </Button>
              </motion.div>

              <motion.div variants={buttonPress} whileTap="tap">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-600"
                  onClick={cancelRecording}
                >
                  <X className="h-4 w-4" />
                </Button>
              </motion.div>

              <motion.div variants={buttonPress} whileTap="tap">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-green-600"
                  onClick={stopRecording}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
