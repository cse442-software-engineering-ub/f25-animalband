import { useEffect, useState, useRef, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { SOUND_CONFIG } from "./stage_soundsConfig";
import { loadSound, playSound, setMasterVolume } from "./stage_audioUtil";
import "./stage.css";

import Ostrich from "../../../assets/ostrich.png";
import OstrichPlaying from "../../../assets/ostrichrockin.png";
import Bird from "../../../assets/bird.png";
import BirdPlaying from "../../../assets/birdrockin.png";
import Hamster from "../../../assets/hamster.png";
import HamsterPlaying from "../../../assets/hamsterrockin.png";
import Kangaroo from "../../../assets/kangaroo.png";
import KangarooPlaying from "../../../assets/kangaroorockin.png";
import Snake from "../../../assets/snake.png";
import SnakePlaying from "../../../assets/snakerockin.png";

export default function DesktopStage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [sounds, setSounds] = useState({});
  const [masterVolume, setMasterVol] = useState(1);
  const [playingAnimals, setPlayingAnimals] = useState({});

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordedTracks, setRecordedTracks] = useState([]);
  const [currentTrack, setCurrentTrack] = useState([]);
  const [recordStartTime, setRecordStartTime] = useState(null);
  const [importedAudioBuffers, setImportedAudioBuffers] = useState([]);
  const [trackCounter, setTrackCounter] = useState(1);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeAudioSources, setActiveAudioSources] = useState([]);

  // Track settings
  const [trackSettings, setTrackSettings] = useState([]);
  const [editingTrack, setEditingTrack] = useState(null);
  const [editingName, setEditingName] = useState("");

  // Local save state
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [recordingTitle, setRecordingTitle] = useState("");
  const [recordingDescription, setRecordingDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Edit mode state
  const [editingRecordingId, setEditingRecordingId] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Track unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [initialTrackCount, setInitialTrackCount] = useState(0);

  // Save option state
  const [saveOption, setSaveOption] = useState("overwrite");
  const [originalTitle, setOriginalTitle] = useState("");

  // Custom modal state
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", message: "", type: "info" });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState({ title: "", message: "", onConfirm: null });
  
  // Tutorial state
  const [showTutorial, setShowTutorial] = useState(false);

  const audioContextRef = useRef(null);
  const requestInProgressRef = useRef(false);
  
  // Performance optimization: Cache gain nodes for reuse
  const gainNodesRef = useRef(new Map());
  
  // Performance optimization: Batch animation updates
  const animationTimersRef = useRef(new Map());

  // Security constants
  const MAX_FILE_SIZE = 50 * 1024 * 1024;
  const MAX_AUDIO_DURATION = 600;
  const MAX_TRACKS = 20;
  const MAX_TITLE_LENGTH = 100;
  const MAX_DESCRIPTION_LENGTH = 500;
  const MAX_TRACK_NAME_LENGTH = 50;

  const ANIMAL_IMAGES = {
    hamster: [Hamster, HamsterPlaying],
    bird: [Bird, BirdPlaying],
    ostrich: [Ostrich, OstrichPlaying],
    kangaroo: [Kangaroo, KangarooPlaying],
    snake: [Snake, SnakePlaying],
  };

  const animalKeyMap = {
    a: "hamster",
    s: "hamster",
    d: "hamster",
    f: "hamster",
    c: "bird",
    v: "bird",
    b: "bird",
    n: "bird",
    h: "ostrich",
    j: "ostrich",
    k: "ostrich",
    l: "ostrich",
    u: "kangaroo",
    i: "kangaroo",
    o: "kangaroo",
    p: "kangaroo",
    q: "snake",
    w: "snake",
    e: "snake",
    r: "snake",
  };

  const sanitizeInput = (input, maxLength = 200) => {
    if (!input) return "";
    return input
      .trim()
      .substring(0, maxLength)
      .replace(/[<>]/g, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+=/gi, "")
      .replace(/[^\w\s\-_.,:;!?()]/g, "");
  };

  const sanitizeFilename = (filename) => {
    if (!filename) return "unnamed";
    return (
      filename
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .substring(0, 50) || "unnamed"
    );
  };

  // Custom modal functions
  const showAlertModal = (title, message, type = "info") => {
    setModalContent({ title, message, type });
    setShowModal(true);
  };

  const showConfirm = (title, message, onConfirm) => {
    setConfirmModalData({ title, message, onConfirm });
    setShowConfirmModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
  };

  const handleConfirm = () => {
    if (confirmModalData.onConfirm) {
      confirmModalData.onConfirm();
    }
    closeConfirmModal();
  };

  useEffect(() => {
    const checkUser = async () => {
      if (requestInProgressRef.current) return;
      requestInProgressRef.current = true;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const res = await fetch(
          "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php/getUser.php",
          {
            credentials: "include",
            signal: controller.signal,
          }
        );
        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        if (data.loggedIn) setUser(data);
      } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === "AbortError") {
          console.error("Request timeout");
        } else {
          console.error("Failed to fetch user", err);
        }
      } finally {
        requestInProgressRef.current = false;
      }
    };
    checkUser();
  }, []);

  // Load recording for editing from URL parameter
  useEffect(() => {
    const loadRecordingForEdit = async () => {
      const params = new URLSearchParams(location.search);
      const recordingId = params.get('edit');
      
      console.log("Edit mode - Location:", location);
      console.log("Edit mode - Search params:", location.search);
      console.log("Edit mode - Recording ID from URL:", recordingId);
      
      if (!recordingId) {
        console.log("No recording ID found in URL, skipping load");
        return;
      }
      
      const cookies = document.cookie.split("; ");
      const cookieObj = Object.fromEntries(cookies.map((c) => c.split("=")));
      const authCookie = cookieObj["auth_token"] || "";
      
      if (!authCookie) {
        showAlertModal("Login Required", "You must be logged in to edit recordings.", "warning");
        navigate("/my-recordings");
        return;
      }

      try {
        const response = await fetch(
          "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php/getLocalRecordings.php",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ auth_token: authCookie }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log("Full response data:", data);
          
          if (data.success && data.recordings) {
            console.log("All recordings:", data.recordings);
            
            const recording = data.recordings.find(
              (r) => r.id === parseInt(recordingId)
            );
            
            console.log("Found recording:", recording);
            
            if (recording) {
              console.log("Recording structure:", recording.recording);
              console.log("Number of tracks in recording:", recording.recording?.length);
              
              setEditingRecordingId(recording.id);
              setRecordingTitle(recording.title);
              setOriginalTitle(recording.title);
              setRecordingDescription(recording.description);
              
              if (!Array.isArray(recording.recording)) {
                console.error("Recording data is not an array:", recording.recording);
                showAlertModal("Invalid Format", "Invalid recording format. Cannot load tracks.", "error");
                return;
              }
              
              const loadableTracks = recording.recording.filter(track => {
                if (!Array.isArray(track)) {
                  console.warn("Track is not an array:", track);
                  return false;
                }
                const hasImported = track.some(note => note.isImported);
                console.log("Track has imported audio:", hasImported, "Track:", track);
                return !hasImported;
              });
              
              console.log("Loadable tracks count:", loadableTracks.length);
              console.log("Loadable tracks:", loadableTracks);
              
              const importedTrackCount = recording.recording.length - loadableTracks.length;
              
              setRecordedTracks(loadableTracks);
              setIsEditMode(true);
              setInitialTrackCount(loadableTracks.length);
              
              const settings = loadableTracks.map((track, idx) => ({
                name: `Track ${idx + 1}`,
                muted: false,
                solo: false,
                volume: 1,
              }));
              setTrackSettings(settings);
              setTrackCounter(loadableTracks.length + 1);
              
              console.log("Track settings initialized:", settings);
              console.log("State updated - recordedTracks should now have", loadableTracks.length, "tracks");
              
              let message = `Loaded recording: ${recording.title}\nLoaded ${loadableTracks.length} track(s)`;
              
              if (importedTrackCount > 0) {
                message += `\n\nNote: ${importedTrackCount} imported audio track(s) were skipped (imported audio cannot be restored from saved recordings).`;
              }
              
              if (loadableTracks.length === 0) {
                message += "\n\nNo keyboard tracks found. You can record new tracks or import audio.";
              }
              
              showAlertModal("Recording Loaded", message, "success");
            } else {
              showAlertModal("Not Found", "Recording not found.", "error");
              navigate("/my-recordings");
            }
          }
        }
      } catch (error) {
        console.error("Error loading recording for edit:", error);
        showAlertModal("Load Failed", "Failed to load recording. Please try again.", "error");
        navigate("/my-recordings");
      }
    };

    loadRecordingForEdit();
  }, [navigate, location]);

  // NEW: Load remix data from featured songs
  useEffect(() => {
    const loadRemixData = () => {
      const params = new URLSearchParams(location.search);
      const remixId = params.get('remix');
      
      if (!remixId) {
        return;
      }
      
      // Get remix data from sessionStorage
      const remixDataStr = sessionStorage.getItem('remixData');
      
      if (!remixDataStr) {
        console.error("No remix data found");
        showAlertModal("Remix Error", "Remix data not found. Please try again.", "error");
        navigate("/");
        return;
      }
      
      try {
        const remixData = JSON.parse(remixDataStr);
        
        // Clear the sessionStorage after reading
        sessionStorage.removeItem('remixData');
        
        console.log("Loading remix data:", remixData);
        
        if (!Array.isArray(remixData.recording)) {
          console.error("Invalid recording format in remix data");
          showAlertModal("Invalid Format", "Invalid recording format. Cannot load remix.", "error");
          return;
        }
        
        // Filter out imported audio tracks (can't be remixed because AudioBuffers can't be serialized)
        const loadableTracks = remixData.recording.filter(track => {
          if (!Array.isArray(track)) {
            console.warn("Track is not an array:", track);
            return false;
          }
          // Check if track has any imported audio notes
          const hasImported = track.some(note => note.isImported);
          return !hasImported;
        });
        
        console.log("Loadable tracks for remix:", loadableTracks.length);
        
        const importedTrackCount = remixData.recording.length - loadableTracks.length;
        
        // Set up the remix
        setRecordedTracks(loadableTracks);
        setRecordingTitle(`Remix of ${remixData.title || 'Untitled'}`);
        setRecordingDescription(
          `Remixed from "${remixData.title || 'Untitled'}" by ${remixData.author || 'Unknown'}\n\n${remixData.description || ''}`
        );
        
        // Initialize track settings
        const settings = loadableTracks.map((track, idx) => ({
          name: `Track ${idx + 1}`,
          muted: false,
          solo: false,
          volume: 1,
        }));
        setTrackSettings(settings);
        setTrackCounter(loadableTracks.length + 1);
        
        // Set flags - remix is NOT edit mode, it's a new recording
        setIsEditMode(false);
        setEditingRecordingId(null);
        setHasUnsavedChanges(false);
        setInitialTrackCount(0);
        
        // Show message
        let message = `🎵 Remix loaded: ${loadableTracks.length} track(s) ready to edit!\n\nFeel free to add, remove, or modify tracks, then save as your own creation.`;
        
        if (importedTrackCount > 0) {
          message += `\n\n⚠️ Note: ${importedTrackCount} imported audio track(s) were skipped (imported audio cannot be included in remixes).`;
        }
        
        if (loadableTracks.length === 0) {
          message += "\n\n📝 No keyboard tracks found in the original. You can start recording from scratch or import audio.";
        }
        
        showAlertModal("🎵 Remix Ready!", message, "success");
        
      } catch (error) {
        console.error("Error parsing remix data:", error);
        showAlertModal("Remix Error", "Failed to load remix data. Please try again.", "error");
        navigate("/");
      }
    };
    
    loadRemixData();
  }, [navigate, location]);

  // Track changes to recorded tracks
  useEffect(() => {
    if (isEditMode && recordedTracks.length !== initialTrackCount) {
      setHasUnsavedChanges(true);
    }
  }, [recordedTracks, isEditMode, initialTrackCount]);

  // Warn before leaving if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Custom navigation handler with warning
  const handleNavigateAway = useCallback((path) => {
    if (hasUnsavedChanges) {
      showConfirm(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to leave? Your changes will be lost.',
        () => navigate(path)
      );
      return;
    }
    navigate(path);
  }, [hasUnsavedChanges, navigate]);

  // Performance: Initialize AudioContext with optimal settings
  useEffect(() => {
    if (!audioContextRef.current || audioContextRef.current.state === "closed") {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContextClass({
        latencyHint: 'interactive',
        sampleRate: 44100
      });
    }

    return () => {
      animationTimersRef.current.forEach(timer => clearTimeout(timer));
      animationTimersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const loadAllSounds = async () => {
      const loadedSounds = {};
      for (const sound of SOUND_CONFIG) {
        try {
          loadedSounds[sound.key] = await loadSound(sound.file);
        } catch (err) {
          console.error(`Failed to load sound: ${sound.key}`, err);
        }
      }
      setSounds(loadedSounds);
    };
    loadAllSounds();
  }, []);

  const triggerAnimalAnimation = useCallback((animal) => {
    const existingTimer = animationTimersRef.current.get(animal);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    setPlayingAnimals((prev) => ({ ...prev, [animal]: true }));
    
    const timer = setTimeout(() => {
      setPlayingAnimals((prev) => ({ ...prev, [animal]: false }));
      animationTimersRef.current.delete(animal);
    }, 300);
    
    animationTimersRef.current.set(animal, timer);
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (
      e.target.tagName === "INPUT" ||
      e.target.tagName === "TEXTAREA" ||
      e.target.isContentEditable ||
      showSaveForm
    ) {
      return;
    }

    const key = e.key.toLowerCase();
    if (!animalKeyMap[key]) return;

    const animal = animalKeyMap[key];
    if (!animal) return;

    if (isRecording) {
      const timeSinceStart = performance.now() - recordStartTime;

      if (timeSinceStart > MAX_AUDIO_DURATION * 1000) {
        showAlertModal("Recording Limit", "Recording limit reached (10 minutes). Please stop recording.", "warning");
        return;
      }

      setCurrentTrack((prev) => [...prev, { key, time: timeSinceStart }]);
    }

    if (sounds[key]) {
      playSound(sounds[key], masterVolume);
      triggerAnimalAnimation(animal);
    }
  }, [sounds, masterVolume, isRecording, recordStartTime, showSaveForm, triggerAnimalAnimation]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    try {
      const savedVol = parseFloat(localStorage.getItem("masterVolume") || "1");
      const validVol = Math.max(0, Math.min(1, savedVol));
      setMasterVol(validVol);
      setMasterVolume(validVol);
    } catch (err) {
      console.error("Error loading volume", err);
      setMasterVol(1);
      setMasterVolume(1);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("masterVolume", masterVolume);
    } catch (err) {
      console.error("Error saving volume", err);
    }
  }, [masterVolume]);

  const toggleRecording = () => {
    if (!isRecording && recordedTracks.length >= MAX_TRACKS) {
      showAlertModal(
        "Maximum Tracks Reached",
        `Maximum number of tracks (${MAX_TRACKS}) reached. Please delete some tracks first.`,
        "warning"
      );
      return;
    }

    if (!isRecording) {
      setCurrentTrack([]);
      setRecordStartTime(performance.now());
      setIsRecording(true);
      if (recordedTracks.length > 0) playTracksDuringRecording();
    } else {
      if (currentTrack.length === 0) {
        showAlertModal("Empty Track", "Cannot save empty track.", "warning");
        setIsRecording(false);
        return;
      }

      const trackName = `Track ${trackCounter}`;
      setRecordedTracks((prev) => [...prev, currentTrack]);
      setTrackSettings((prev) => [
        ...prev,
        { name: trackName, muted: false, solo: false, volume: 1 },
      ]);
      setTrackCounter((c) => c + 1);
      setIsRecording(false);
      stopPlayback();
    }
  };

  const playTracksDuringRecording = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
        latencyHint: 'interactive',
        sampleRate: 44100
      });
    }
    
    const audioContext = audioContextRef.current;
    
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    const sources = [];
    const timeouts = [];
    const startTime = audioContext.currentTime;

    recordedTracks.forEach((track, trackIndex) => {
      const trackVolume = trackSettings[trackIndex]?.volume ?? 1;
      const finalGain = masterVolume * trackVolume;
      
      track.forEach(({ key, time, isImported, audioBuffer }) => {
        const scheduleTime = startTime + time / 1000;
        
        if (isImported && audioBuffer) {
          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;
          const gainNode = audioContext.createGain();
          gainNode.gain.value = finalGain;
          source.connect(gainNode).connect(audioContext.destination);
          source.start(scheduleTime);
          sources.push(source);
        } else if (sounds[key]) {
          const animal = animalKeyMap[key];
          const source = audioContext.createBufferSource();
          source.buffer = sounds[key];

          const gainNode = audioContext.createGain();
          gainNode.gain.value = finalGain;

          source.connect(gainNode).connect(audioContext.destination);
          source.start(scheduleTime);
          sources.push(source);

          if (animal) {
            const timeout1 = setTimeout(() => {
              triggerAnimalAnimation(animal);
            }, time);
            timeouts.push(timeout1);
          }
        }
      });
    });

    setActiveAudioSources({ sources, timeouts });
  }, [recordedTracks, trackSettings, sounds, masterVolume, triggerAnimalAnimation]);

  const playAllTracks = useCallback(() => {
    if (recordedTracks.length === 0) return;
    
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
        latencyHint: 'interactive',
        sampleRate: 44100
      });
    }
    
    const audioContext = audioContextRef.current;
    
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    
    setIsPlaying(true);

    const sources = [];
    const timeouts = [];
    const startTime = audioContext.currentTime;
    const anySolo = trackSettings.some((t) => t.solo);

    let longestTrack = 0;

    recordedTracks.forEach((track, trackIndex) => {
      const settings = trackSettings[trackIndex];

      if (settings?.muted || (anySolo && !settings?.solo)) return;

      const trackVolume = settings?.volume ?? 1;
      const finalGain = masterVolume * trackVolume;

      track.forEach(({ key, time, isImported, audioBuffer }) => {
        const scheduleTime = startTime + time / 1000;
        
        if (isImported && audioBuffer) {
          try {
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            const gainNode = audioContext.createGain();
            gainNode.gain.value = finalGain;
            source.connect(gainNode).connect(audioContext.destination);
            source.start(scheduleTime);
            sources.push(source);
            
            longestTrack = Math.max(longestTrack, time + audioBuffer.duration * 1000);
          } catch (err) {
            console.error("Error playing imported audio:", err);
          }
        } else if (sounds[key]) {
          try {
            const animal = animalKeyMap[key];
            const source = audioContext.createBufferSource();
            source.buffer = sounds[key];

            const gainNode = audioContext.createGain();
            gainNode.gain.value = finalGain;

            source.connect(gainNode).connect(audioContext.destination);
            source.start(scheduleTime);
            sources.push(source);

            if (animal) {
              const timeout1 = setTimeout(() => {
                triggerAnimalAnimation(animal);
              }, time);
              timeouts.push(timeout1);
            }
            
            longestTrack = Math.max(longestTrack, time + 1000);
          } catch (err) {
            console.error("Error playing sound:", err);
          }
        }
      });
    });

    setActiveAudioSources({ sources, timeouts });

    const endTimeout = setTimeout(() => {
      setIsPlaying(false);
      setActiveAudioSources([]);
    }, longestTrack + 400);
    timeouts.push(endTimeout);
  }, [recordedTracks, trackSettings, sounds, masterVolume, triggerAnimalAnimation]);

  const stopPlayback = useCallback(() => {
    if (activeAudioSources.sources) {
      activeAudioSources.sources.forEach((source) => {
        try {
          source.stop();
        } catch (e) {
          // Source may have already stopped
        }
      });

      activeAudioSources.timeouts.forEach((timeout) => {
        clearTimeout(timeout);
      });

      setActiveAudioSources([]);
      setIsPlaying(false);
      setPlayingAnimals({});
    }
  }, [activeAudioSources]);

  const deleteTrack = (index) => {
    setRecordedTracks((prev) => prev.filter((_, i) => i !== index));
    setTrackSettings((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAllTracks = () => {
    if (recordedTracks.length > 0) {
      showConfirm(
        "Clear All Tracks",
        "Are you sure you want to clear all tracks? This cannot be undone.",
        () => {
          setRecordedTracks([]);
          setTrackSettings([]);
          setTrackCounter(1);
          stopPlayback();
        }
      );
      return;
    }
  };

  const exportRecording = async () => {
    if (!audioContextRef.current || recordedTracks.length === 0) return;

    let fileName = prompt(
      "Enter a name for your recording:",
      "animalband_recording"
    );

    if (!fileName) return;

    fileName = sanitizeFilename(fileName);

    try {
      let maxDuration = 0;
      recordedTracks.forEach((track) => {
        if (track.length === 0) return;
        const lastNote = track[track.length - 1];
        if (lastNote.isImported && lastNote.audioBuffer) {
          const trackEnd = lastNote.time + lastNote.audioBuffer.duration * 1000;
          maxDuration = Math.max(maxDuration, trackEnd);
        } else {
          maxDuration = Math.max(maxDuration, lastNote.time + 1000);
        }
      });

      const duration = maxDuration / 1000;
      const offlineCtx = new OfflineAudioContext(2, 44100 * duration, 44100);

      recordedTracks.forEach((track, trackIndex) => {
        const trackVolume = trackSettings[trackIndex]?.volume ?? 1;
        track.forEach(({ key, time, isImported, audioBuffer }) => {
          if (isImported && audioBuffer) {
            const source = offlineCtx.createBufferSource();
            source.buffer = audioBuffer;
            const gainNode = offlineCtx.createGain();
            gainNode.gain.value = masterVolume * trackVolume;
            source.connect(gainNode).connect(offlineCtx.destination);
            source.start(time / 1000);
          } else {
            const buffer = sounds[key];
            if (!buffer) return;
            const source = offlineCtx.createBufferSource();
            source.buffer = buffer;
            const gainNode = offlineCtx.createGain();
            gainNode.gain.value = masterVolume * trackVolume;
            source.connect(gainNode).connect(offlineCtx.destination);
            source.start(time / 1000);
          }
        });
      });

      const renderedBuffer = await offlineCtx.startRendering();
      const wavBlob = bufferToWav(renderedBuffer);

      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}.wav`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
      showAlertModal("Export Failed", "Failed to export recording. Please try again.", "error");
    }
  };

  const saveRecordingLocally = async () => {
  if (isSaving) return;

  const sanitizedTitle = sanitizeInput(recordingTitle, MAX_TITLE_LENGTH);
  const sanitizedDescription = sanitizeInput(
    recordingDescription,
    MAX_DESCRIPTION_LENGTH
  );

    if (!sanitizedTitle) {
      showAlertModal("Title Required", "Please enter a valid title.", "warning");
      return;
    }

    if (recordedTracks.length === 0) {
      showAlertModal("No Tracks", "No tracks to save.", "warning");
      return;
    }

  setIsSaving(true);

  const cookies = document.cookie.split("; ");
  const cookieObj = Object.fromEntries(cookies.map((c) => c.split("=")));
  const authCookie = cookieObj["auth_token"] || "";

    if (!authCookie) {
      showAlertModal("Login Required", "You must be logged in to save recordings.", "warning");
      setIsSaving(false);
      return;
    }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const endpoint = "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php/saveRecordingsLocal.php";

    const payload = {
      recording: recordedTracks,
      title: sanitizedTitle,
      description: sanitizedDescription,
      userToken: authCookie,
    };

    // Include recordingId if in edit mode AND overwriting
    if (isEditMode && saveOption === "overwrite") {
      if (!editingRecordingId) {
        alert("Error: Missing recording ID for overwrite operation.");
        setIsSaving(false);
        return;
      }
      payload.recordingId = editingRecordingId;
      console.log("Overwriting recording with ID:", editingRecordingId);
    } else {
      console.log("Saving as new recording (remix or new)");
    }
    // For remix or new recordings, we don't include recordingId

    console.log("Sending payload:", payload);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      if (isEditMode && saveOption === "overwrite") {
        alert("Recording updated successfully!");
        setHasUnsavedChanges(false);
        setInitialTrackCount(recordedTracks.length);
      } else if (isEditMode && saveOption === "remix") {
        alert("Remix saved as a new recording!");
        setIsEditMode(false);
        setEditingRecordingId(null);
        setHasUnsavedChanges(false);
      } else {
        alert("Recording saved successfully!");
      }
      
      setShowSaveForm(false);
      
      if (!isEditMode || saveOption === "remix") {
        setRecordingTitle("");
        setRecordingDescription("");
      }
    } else {
      const errorText = await response.text();
      console.error("Save failed:", errorText);
      alert("Failed to save recording. Please try again.");
    }
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      alert("Request timeout. Please try again.");
    } else {
      console.error("Save error:", err);
      alert("Error saving recording. Please try again.");
    }
  } finally {
    setIsSaving(false);
  }
};

  function bufferToWav(buffer) {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArray = new ArrayBuffer(length);
    const view = new DataView(bufferArray);

    const writeString = (view, offset, string) => {
      for (let i = 0; i < string.length; i++)
        view.setUint8(offset + i, string.charCodeAt(i));
    };

    let offset = 0;
    writeString(view, offset, "RIFF");
    offset += 4;
    view.setUint32(offset, 36 + buffer.length * numOfChan * 2, true);
    offset += 4;
    writeString(view, offset, "WAVE");
    offset += 4;
    writeString(view, offset, "fmt ");
    offset += 4;
    view.setUint32(offset, 16, true);
    offset += 4;
    view.setUint16(offset, 1, true);
    offset += 2;
    view.setUint16(offset, numOfChan, true);
    offset += 2;
    view.setUint32(offset, buffer.sampleRate, true);
    offset += 4;
    view.setUint32(offset, buffer.sampleRate * 2 * numOfChan, true);
    offset += 4;
    view.setUint16(offset, numOfChan * 2, true);
    offset += 2;
    view.setUint16(offset, 16, true);
    offset += 2;
    writeString(view, offset, "data");
    offset += 4;
    view.setUint32(offset, buffer.length * numOfChan * 2, true);
    offset += 4;

    const interleaved = interleave(buffer);
    let index = 44;
    for (let i = 0; i < interleaved.length; i++, index += 2) {
      const sample = Math.max(-1, Math.min(1, interleaved[i]));
      view.setInt16(
        index,
        sample < 0 ? sample * 0x8000 : sample * 0x7fff,
        true
      );
    }

    return new Blob([view], { type: "audio/wav" });
  }

  function interleave(buffer) {
    const inputL = buffer.getChannelData(0);
    const inputR =
      buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : inputL;
    const interleaved = new Float32Array(buffer.length * 2);
    for (let i = 0, j = 0; i < buffer.length; i++, j += 2) {
      interleaved[j] = inputL[i];
      interleaved[j + 1] = inputR[i];
    }
    return interleaved;
  }

  const toggleMute = (index) => {
    setTrackSettings((prev) =>
      prev.map((t, i) =>
        i === index ? { ...t, muted: !t.muted, solo: false } : t
      )
    );
  };

  const toggleSolo = (index) => {
    setTrackSettings((prev) =>
      prev.map((t, i) => (i === index ? { ...t, solo: !t.solo } : t))
    );
  };

  const setTrackVolume = (index, volume) => {
    const newVolume = Math.max(0, Math.min(1, parseFloat(volume)));
    setTrackSettings((prev) =>
      prev.map((t, i) => (i === index ? { ...t, volume: newVolume } : t))
    );
  };

  const startRename = (index) => {
    setEditingTrack(index);
    setEditingName(trackSettings[index]?.name || `Track ${index + 1}`);
  };

  const finishRename = (index) => {
    const sanitizedName = sanitizeInput(editingName, MAX_TRACK_NAME_LENGTH);
    if (sanitizedName) {
      setTrackSettings((prev) =>
        prev.map((t, i) => (i === index ? { ...t, name: sanitizedName } : t))
      );
    }
    setEditingTrack(null);
  };

  const importAudioTrack = () => {
    if (recordedTracks.length >= MAX_TRACKS) {
      showAlertModal(
        "Maximum Tracks Reached",
        `Maximum number of tracks (${MAX_TRACKS}) reached. Please delete some tracks first.`,
        "warning"
      );
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "audio/*";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (file.size > MAX_FILE_SIZE) {
        showAlertModal(
          "File Too Large",
          `File is too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
          "error"
        );
        return;
      }

      const allowedTypes = [
        "audio/mpeg",
        "audio/wav",
        "audio/ogg",
        "audio/mp3",
        "audio/webm",
        "audio/mp4",
        "audio/x-m4a",
      ];

      if (
        !allowedTypes.includes(file.type) &&
        !file.name.match(/\.(mp3|wav|ogg|webm|m4a)$/i)
      ) {
        showAlertModal(
          "Invalid File Type",
          "Invalid file type. Please upload a valid audio file (MP3, WAV, OGG, WebM, M4A).",
          "error"
        );
        return;
      }

      try {
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await audioContextRef.current.decodeAudioData(
          arrayBuffer
        );

        if (audioBuffer.duration > MAX_AUDIO_DURATION) {
          showAlertModal(
            "Audio Too Long",
            `Audio file is too long. Maximum duration is ${MAX_AUDIO_DURATION / 60} minutes.`,
            "error"
          );
          return;
        }

        const sanitizedFileName = sanitizeFilename(file.name);

        const importedTrack = [
          {
            key: `imported_${Date.now()}`,
            time: 0,
            isImported: true,
            audioBuffer: audioBuffer,
            fileName: sanitizedFileName,
          },
        ];

        setRecordedTracks((prev) => [...prev, importedTrack]);
        setTrackSettings((prev) => [
          ...prev,
          { name: sanitizedFileName, muted: false, solo: false, volume: 1 },
        ]);
        setTrackCounter((c) => c + 1);
        setImportedAudioBuffers((prev) => [...prev, audioBuffer]);

        showAlertModal("Success", `Successfully imported: ${sanitizedFileName}`, "success");
      } catch (err) {
        console.error("Error importing audio:", err);
        showAlertModal(
          "Import Failed",
          "Failed to import audio file. Make sure it's a valid audio format and not corrupted.",
          "error"
        );
      }
    };
    input.click();
  };

  return (
    <div className="stagestuff">
      <div className="landing-page">
        <header className="header">
          <Link to="/" className="logo-section">
            <span className="material-symbols-outlined paw-icon">pets</span>
            <h1 className="site-title">ANIMALBAND</h1>
          </Link>

          <div className="header-buttons">
            {!user ? (
              <>
                <button
                  className="btn-login"
                  onClick={() => navigate("/login")}
                >
                  Login
                </button>
                <button
                  className="btn-register"
                  onClick={() => navigate("/register")}
                >
                  Register
                </button>
              </>
            ) : (
              <img
                src={`https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php/${user.profilePic}`}
                alt="Profile"
                className="profile-pic"
                onClick={() => navigate("/account")}
                style={{
                  width: "75px",
                  height: "75px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  objectFit: "cover",
                }}
              />
            )}
          </div>
        </header>

        {isEditMode && (
          <div className="edit-mode-banner" style={{
            backgroundColor: '#15803d',
            color: 'white',
            padding: '10px',
            textAlign: 'center',
            fontWeight: 'bold',
            marginTop: '10px'
          }}>
            Editing: {recordingTitle || 'Untitled Recording'}
            {hasUnsavedChanges && <span style={{ marginLeft: '10px', fontSize: '14px' }}>• Unsaved Changes</span>}
          </div>
        )}

        <section className="band-stage">
          <div className="animals-container">
            {Object.keys(ANIMAL_IMAGES).map((animal) => (
              <div key={animal} className="animal-member">
                <img
                  src={
                    playingAnimals[animal]
                      ? ANIMAL_IMAGES[animal][1]
                      : ANIMAL_IMAGES[animal][0]
                  }
                  alt={`${animal} instrument`}
                  className={playingAnimals[animal] ? "playing" : ""}
                />
                <div className="animal-controls">
                  <p className="key-text">
                    {
                      Object.entries({
                        hamster: "A S D F",
                        bird: "C V B N",
                        ostrich: "H J K L",
                        kangaroo: "U I O P",
                        snake: "Q W E R",
                      })[Object.keys(ANIMAL_IMAGES).indexOf(animal)][1]
                    }
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="bottom-controls">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={masterVolume}
            onChange={(e) => {
              const newVol = Math.max(
                0,
                Math.min(1, parseFloat(e.target.value))
              );
              setMasterVol(newVol);
              setMasterVolume(newVol);
            }}
            className="volume-slider"
            aria-label="Master Volume"
          />

          <div className="circle-buttons">
            <button
              onClick={toggleRecording}
              className={`circle-btn ${isRecording ? "stop" : "record"}`}
              aria-label={isRecording ? "Stop Recording" : "Start Recording"}
              disabled={recordedTracks.length >= MAX_TRACKS && !isRecording}
            >
              {isRecording ? "■" : "●"}
            </button>

            <button
              onClick={isPlaying ? stopPlayback : playAllTracks}
              disabled={isRecording || recordedTracks.length === 0}
              className={`circle-btn play ${isPlaying ? "playing" : ""}`}
              aria-label={isPlaying ? "Stop Playback" : "Play All Tracks"}
            >
              {isPlaying ? "■" : "►"}
            </button>

            <button
              onClick={exportRecording}
              disabled={recordedTracks.length === 0}
              className="circle-btn export"
              aria-label="Export Recording"
            >
              ⬇
            </button>

            <button
              onClick={() => setShowSaveForm(true)}
              disabled={recordedTracks.length === 0}
              className="circle-btn export"
              aria-label="Save Recording"
            >
              <span className="material-symbols-outlined export-icon">
                save
              </span>
            </button>

            <button
              onClick={importAudioTrack}
              className="circle-btn import"
              title="Import Audio Track"
              aria-label="Import Audio Track"
              disabled={recordedTracks.length >= MAX_TRACKS}
            >
              <span className="material-symbols-outlined export-icon">
                upload
              </span>
            </button>
            
            <button
              onClick={() => setShowTutorial(true)}
              className="circle-btn tutorial"
              title="Tutorial"
              aria-label="Show Tutorial"
            >
              ?
            </button>
          </div>
        </div>

        {showSaveForm && (
          <div className="modal-overlay" onClick={() => setShowSaveForm(false)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <h3>{isEditMode ? 'Save Your Changes' : 'Save Your Recording'}</h3>
              
              {isEditMode && (
                <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
                  <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>Save Options:</p>
                  <label style={{ display: 'block', marginBottom: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      value="overwrite"
                      checked={saveOption === "overwrite"}
                      onChange={(e) => {
                        setSaveOption(e.target.value);
                        setRecordingTitle(originalTitle);
                      }}
                      style={{ marginRight: '8px' }}
                    />
                    Overwrite Original - Update the existing recording
                  </label>
                  <label style={{ display: 'block', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      value="remix"
                      checked={saveOption === "remix"}
                      onChange={(e) => {
                        setSaveOption(e.target.value);
                        setRecordingTitle(`Copy of ${originalTitle}`);
                      }}
                      style={{ marginRight: '8px' }}
                    />
                    Save as Remix - Create a new copy
                  </label>
                </div>
              )}
              
              <label>
                Title:
                <input
                  type="text"
                  value={recordingTitle}
                  onChange={(e) => setRecordingTitle(e.target.value)}
                  placeholder="Your Recording"
                  maxLength={MAX_TITLE_LENGTH}
                  required
                  aria-label="Recording Title"
                />
              </label>
              <label>
                Description:
                <textarea
                  value={recordingDescription}
                  onChange={(e) => setRecordingDescription(e.target.value)}
                  placeholder="Description of your recording."
                  maxLength={MAX_DESCRIPTION_LENGTH}
                  aria-label="Recording Description"
                />
              </label>
              <div className="form-buttons">
                <button
                  onClick={() => setShowSaveForm(false)}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button onClick={saveRecordingLocally} disabled={isSaving}>
                  {isSaving 
                    ? "Saving..." 
                    : isEditMode 
                      ? (saveOption === "overwrite" ? "Update Recording" : "Save as Remix")
                      : "Save Recording"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Alert Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-box alert-modal" onClick={(e) => e.stopPropagation()}>
              <div className={`modal-header ${modalContent.type}`}>
                <h3>{modalContent.title}</h3>
              </div>
              <div className="modal-content">
                <p style={{ whiteSpace: 'pre-line' }}>{modalContent.message}</p>
              </div>
              <div className="form-buttons">
                <button onClick={closeModal} className="btn-primary">OK</button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Confirm Modal */}
        {showConfirmModal && (
          <div className="modal-overlay" onClick={closeConfirmModal}>
            <div className="modal-box confirm-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header warning">
                <h3>{confirmModalData.title}</h3>
              </div>
              <div className="modal-content">
                <p style={{ whiteSpace: 'pre-line' }}>{confirmModalData.message}</p>
              </div>
              <div className="form-buttons">
                <button onClick={closeConfirmModal}>Cancel</button>
                <button onClick={handleConfirm} className="btn-danger">Confirm</button>
              </div>
            </div>
          </div>
        )}

        {/* Tutorial Modal */}
        {showTutorial && (
          <div className="modal-overlay" onClick={() => setShowTutorial(false)}>
            <div className="modal-box tutorial-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header info">
                <h3>How to Use ANIMALBAND</h3>
              </div>
              <div className="modal-content tutorial-content">
                <section>
                  <h4>Keyboard Controls</h4>
                  <ul>
                    <li><strong>Hamster (Drums):</strong> Press A, S, D, or F</li>
                    <li><strong>Bird (Vocal):</strong> Press C, V, B, or N</li>
                    <li><strong>Ostrich (Keys):</strong> Press H, J, K, or L</li>
                    <li><strong>Kangaroo (Guitar):</strong> Press U, I, O, or P</li>
                    <li><strong>Snake (Bass):</strong> Press Q, W, E, or R</li>
                  </ul>
                </section>

                <section>
                  <h4>Control Buttons</h4>
                  <ul>
                    <li><strong>● (Red Circle):</strong> Start/Stop recording a new track</li>
                    <li><strong>► (Play):</strong> Play all recorded tracks</li>
                    <li><strong>⬇ (Download):</strong> Export your recording as a WAV file</li>
                    <li><strong>💾 (Save):</strong> Save your recording to your account</li>
                    <li><strong>⬆ (Upload):</strong> Import an audio file as a track</li>
                    <li><strong>? (Help):</strong> Show this tutorial</li>
                  </ul>
                </section>

                <section>
                  <h4>Track Management</h4>
                  <ul>
                    <li><strong>Volume Slider:</strong> Adjust the master volume (top) or individual track volumes</li>
                    <li><strong>Mute:</strong> Temporarily silence a track</li>
                    <li><strong>Solo:</strong> Play only this track (mutes all others)</li>
                    <li><strong>Rename:</strong> Double-click a track name or use the Rename button</li>
                    <li><strong>Delete:</strong> Remove a track permanently</li>
                  </ul>
                </section>

                <section>
                  <h4>💡 Tips</h4>
                  <ul>
                    <li>Record up to {MAX_TRACKS} tracks total</li>
                    <li>While recording, existing tracks will play along</li>
                    <li>You can import audio files (MP3, WAV, OGG, WebM, M4A)</li>
                    <li>Maximum recording length: {MAX_AUDIO_DURATION / 60} minutes per track</li>
                    <li>Save your creations to access them later from "My Recordings"</li>
                    <li>Edit saved recordings by clicking the edit button in "My Recordings"</li>
                  </ul>
                </section>
              </div>
              <div className="form-buttons">
                <button onClick={() => setShowTutorial(false)} className="btn-primary">Got It!</button>
              </div>
            </div>
          </div>
        )}

        <div className="track-list" style={{
          maxHeight: '400px',
          overflowY: 'auto',
          overflowX: 'hidden',
          border: '1px solid #ccc',
          borderRadius: '8px',
          padding: '15px',
          marginTop: '20px'
        }}>
          <h3>
            Recorded Tracks ({recordedTracks.length}/{MAX_TRACKS})
          </h3>
          {recordedTracks.length === 0 && <p>No tracks yet.</p>}
          {recordedTracks.map((track, index) => (
            <div key={index} className="track-item">
              {editingTrack === index ? (
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={() => finishRename(index)}
                  onKeyDown={(e) => e.key === "Enter" && finishRename(index)}
                  autoFocus
                  maxLength={MAX_TRACK_NAME_LENGTH}
                  style={{ marginRight: "10px" }}
                  aria-label="Track Name"
                />
              ) : (
                <span
                  onDoubleClick={() => startRename(index)}
                  title="Double-click to rename"
                >
                  {trackSettings[index]?.name || `Track ${index + 1}`}
                </span>
              )}
              <div className="track-buttons">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={trackSettings[index]?.volume ?? 1}
                  onChange={(e) => setTrackVolume(index, e.target.value)}
                  className="track-volume-slider"
                  title="Track Volume"
                  style={{ width: "100px", marginRight: "5px" }}
                  aria-label={`Volume for ${
                    trackSettings[index]?.name || `Track ${index + 1}`
                  }`}
                />
                <span style={{ fontSize: "12px", marginRight: "10px" }}>
                  {Math.round((trackSettings[index]?.volume ?? 1) * 100)}%
                </span>
                <button className="pill-btn" onClick={() => toggleMute(index)}>
                  {trackSettings[index]?.muted ? "Unmute" : "Mute"}
                </button>
                <button className="pill-btn" onClick={() => toggleSolo(index)}>
                  {trackSettings[index]?.solo ? "Unsolo" : "Solo"}
                </button>
                <button className="pill-btn" onClick={() => startRename(index)}>Rename</button>
                <button className="pill-btn" onClick={() => deleteTrack(index)}>Delete</button>
              </div>
            </div>
          ))}
        </div>

        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
          rel="stylesheet"
        />
      </div>
    </div>
  );
}