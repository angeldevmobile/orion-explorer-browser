declare global {
  interface Window {
    process?: {
      type?: string;
    };
  }
}

class VoiceService {
  private recognition: SpeechRecognition | null = null;
  private synthesis = window.speechSynthesis;
  private isListening = false;

  async startListening(
    onResult: (text: string) => void,
    onError: (error: Error | Event) => void,
    onInterim?: (text: string) => void
  ) {
    const isElectron = !!(window && window.process && window.process.type);

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    // Forzar Google Cloud en Electron, aunque SpeechRecognition exista
    if (SpeechRecognition && !isElectron) {
      // Usar Web Speech API si está disponible
      this.recognition = new SpeechRecognition();
      this.recognition.lang = "es-ES";
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        this.isListening = true;
        console.log("🎤 Reconocimiento de voz iniciado");
      };

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        const result = event.results[event.resultIndex];
        const transcript = result[0].transcript;

        if (result.isFinal) {
          console.log("✅ Transcripción final:", transcript);
          onResult(transcript);
        } else if (onInterim) {
          console.log("⏳ Transcripción intermedia:", transcript);
          onInterim(transcript);
        }
      };

      this.recognition.onerror = (event) => {
        console.error("❌ Error de reconocimiento:", event.error);
        this.isListening = false;
        onError(event);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        console.log("🛑 Reconocimiento de voz finalizado");
      };

      try {
        this.recognition.start();
      } catch (error) {
        onError(error);
      }
    } else {
      // Si no hay Web Speech API, usar Google Cloud (grabando y enviando audio)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        const audioChunks: Blob[] = [];

        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          const formData = new FormData();
          formData.append('audio', audioBlob, 'audio.wav');

          try {
            const response = await fetch('http://localhost:3000/api/voice/recognize', {
              method: 'POST',
              body: formData,
            });
            const data = await response.json();
            if (data.success) {
              onResult(data.transcript);
            } else {
              onError(new Error(data.error));
            }
          } catch (err) {
            onError(err);
          }
        };

        mediaRecorder.start();
        this.isListening = true;
        console.log("🎤 Grabando audio para Google Cloud Speech-to-Text");

        // Detener después de 5 segundos (puedes cambiar esto)
        setTimeout(() => {
          mediaRecorder.stop();
          this.isListening = false;
        }, 5000);
      } catch (err) {
        onError(err);
      }
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
    // No es necesario detener mediaRecorder aquí porque se detiene solo por timeout
  }

  speak(text: string, onEnd?: () => void) {
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-ES";
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const voices = this.synthesis.getVoices();
    const spanishVoice = voices.find(
      (voice) => voice.lang === "es-ES" || voice.lang.startsWith("es")
    );
    if (spanishVoice) {
      utterance.voice = spanishVoice;
    }

    utterance.onstart = () => {
      console.log("🔊 Reproduciendo audio:", text);
    };

    utterance.onend = () => {
      console.log("✅ Audio finalizado");
      onEnd?.();
    };

    utterance.onerror = (event) => {
      console.error("❌ Error en síntesis de voz:", event);
    };

    this.synthesis.speak(utterance);
  }

  stopSpeaking() {
    this.synthesis.cancel();
  }

  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.synthesis.getVoices();
  }

  isSupported(): boolean {
    const hasSpeechRecognition =
      "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
    const hasSpeechSynthesis = "speechSynthesis" in window;

    return hasSpeechRecognition && hasSpeechSynthesis;
  }

  getIsListening(): boolean {
    return this.isListening;
  }
}

export const voiceService = new VoiceService();