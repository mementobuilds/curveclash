import { create } from 'zustand';

interface AudioStore {
  soundEnabled: boolean;
  toggleSound: () => void;
  playSound: (soundName: string) => void;
  sounds: { [key: string]: HTMLAudioElement };
}

export const useAudio = create<AudioStore>((set, get) => ({
  soundEnabled: true,
  sounds: {},
  
  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
  
  playSound: (soundName: string) => {
    const { soundEnabled, sounds } = get();
    
    if (!soundEnabled) return;
    
    if (sounds[soundName]) {
      sounds[soundName].currentTime = 0;
      sounds[soundName].play().catch(err => console.log('Audio play error:', err));
    } else {
      try {
        const audio = new Audio(`/sounds/${soundName}.mp3`);
        audio.volume = 0.5;
        audio.play().catch(err => console.log('Audio play error:', err));
        
        // Store the sound for future use
        set((state) => ({
          sounds: {
            ...state.sounds,
            [soundName]: audio
          }
        }));
      } catch (error) {
        console.error('Failed to play sound:', error);
      }
    }
  }
}));