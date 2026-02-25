import React, { useEffect, useRef } from 'react';
import abcjs from 'abcjs';

// Simple test component to verify MIDI functionality
const MIDITest: React.FC = () => {
  const paperRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const abcNotation = `X: 1
T: Cooley's
M: 4/4
L: 1/8
R: reel
K: Emin
|:D2|EB{c}BA B2 EB|~B2 AB dBAG|FDAD BDAD|FDAD dAFD|
EBBA B2 EB|B2 AB defg|afe^c dBAF|DEFD E2:|`;

    if (paperRef.current) {
      // Render the ABC notation
      const rendered = abcjs.renderAbc(paperRef.current, abcNotation, {
        responsive: 'resize',
        add_classes: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        clickListener: (abcElem: any) => {
          console.log('Note clicked:', abcElem);

          // Check if the element has MIDI pitches
          if (abcElem.midiPitches) {
            console.log('MIDI pitches:', abcElem.midiPitches);
            
            // Try to play the note using the synth
            abcjs.synth
              .activeAudioContext()
              .resume()
              .then(() => {
                // Create a temporary synth to play the note
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const synth = new (abcjs.synth as any).CreateSynth();
                
                // Initialize with minimal options
                synth.init({
                  visualObj: { 
                    // Mock visual object with basic properties
                    millisecondsPerMeasure: () => 1000,
                  },
                  options: {
                    soundFontUrl: `https://paulrosen.github.io/midi-js-soundfonts/FluidR3_GM/`,
                  }
                })
                .then(() => {
                  synth.prime().then(() => {
                    // Play the event
                    synth.play(abcElem.midiPitches, abcElem.midiGraceNotePitches, 1000);
                  });
                })
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .catch((err: any) => {
                  console.error('Synth initialization failed:', err);
                });
              })
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .catch((err: any) => {
                console.error('Audio context resume failed:', err);
              });
          } else {
            console.warn('No MIDI pitches found for this element:', abcElem);
          }
        }
      });
      
      console.log('ABC notation rendered successfully');
      console.log('Rendered elements:', rendered);
    }
  }, []);

  return (
    <div>
      <h2>MIDI Test Component</h2>
      <div id="test-paper" ref={paperRef}></div>
      <p>Click on the notes to test MIDI playback</p>
    </div>
  );
};

export default MIDITest;