import { useEffect, useState, useRef, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { SOUND_CONFIG } from "./stage_soundsConfig";
import { loadSound, playSound, setMasterVolume } from "./stage_audioUtil";
import "./mobile_stage.css";

import Ostrich from "../../../assets/ostrich.jpeg";
import OstrichPlaying from "../../../assets/ostrich_playing.jpeg";
import Bird from "../../../assets/bird.jpeg";
import BirdPlaying from "../../../assets/bird_playing.jpeg";
import Hamster from "../../../assets/hamster.jpeg";
import HamsterPlaying from "../../../assets/hamsterrockin.png";
import Kangaroo from "../../../assets/kangaroo.jpeg";
import KangarooPlaying from "../../../assets/kangaroo_playing.jpeg";
import Snake from "../../../assets/snake.jpeg";
import SnakePlaying from "../../../assets/snake_playing.jpeg";

export default function MobileStage() {
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

  const [showExportForm, setShowExportForm] = useState(false);
  const [exportFileName, setExportFileName] = useState("animalband_recording");

  const audioContextRef = useRef(null);
  const requestInProgressRef = useRef(false);
  
  // Performance optimization: Cache for animation timers
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

  const ANIMAL_KEYS = {
    hamster: ["a", "s", "d", "f"],
    bird: ["c", "v", "b", "n"],
    ostrich: ["h", "j", "k", "l"],
    kangaroo: ["u", "i", "o", "p"],
    snake: ["q", "w", "e", "r"],
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
      
      if (!recordingId) return;
      
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
          if (data.success && data.recordings) {
            const recording = data.recordings.find(
              (r) => r.id === parseInt(recordingId)
            );
            
            if (recording) {
              setEditingRecordingId(recording.id);
              setRecordingTitle(recording.title);
              setOriginalTitle(recording.title);
              setRecordingDescription(recording.description);
              
              const loadableTracks = recording.recording.filter(track => {
                if (!Array.isArray(track)) return false;
                return !track.some(note => note.isImported);
              });
              
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
        
        // Filter out imported audio tracks
        const loadableTracks = remixData.recording.filter(track => {
          if (!Array.isArray(track)) {
            console.warn("Track is not an array:", track);
            return false;
          }
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

  const handleTap = useCallback((key) => {
    if (showSaveForm) return;
    if (!animalKeyMap[key]) return;
    if (!sounds[key]) return;

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

    playSound(sounds[key], masterVolume);
    triggerAnimalAnimation(animal);
  }, [showSaveForm, animalKeyMap, sounds, isRecording, recordStartTime, masterVolume, triggerAnimalAnimation]);

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
          try {
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            const gainNode = audioContext.createGain();
            gainNode.gain.value = finalGain;
            source.connect(gainNode).connect(audioContext.destination);
            source.start(scheduleTime);
            sources.push(source);
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
          } catch (err) {
            console.error("Error playing sound:", err);
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

  
const exportRecording = async () => {
  if (!audioContextRef.current || recordedTracks.length === 0) return;

  // Show the export modal instead of using prompt
  setShowExportForm(true);
};

const performExport = async () => {
  const sanitizedFileName = sanitizeFilename(exportFileName);

  if (!sanitizedFileName) {
    showAlertModal("Invalid Name", "Please enter a valid filename.", "warning");
    return;
  }

  setShowExportForm(false);

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
      const anySolo = trackSettings.some((t) => t.solo);
      const settings = trackSettings[trackIndex];
      
      // Skip muted tracks or non-solo tracks when solo is active
      if (settings?.muted || (anySolo && !settings?.solo)) return;

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
    a.download = `${sanitizedFileName}.wav`;
    a.click();
    URL.revokeObjectURL(url);
    
    showAlertModal("Success", `Recording exported as ${sanitizedFileName}.wav`, "success");
    setExportFileName("animalband_recording"); // Reset for next time
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
        showAlertModal("Error", "Missing recording ID for overwrite operation.", "error");
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
        showAlertModal("Success", "Recording updated successfully!", "success");
        setHasUnsavedChanges(false);
        setInitialTrackCount(recordedTracks.length);
      } else if (isEditMode && saveOption === "remix") {
        showAlertModal("Success", "Remix saved as a new recording!", "success");
        setIsEditMode(false);
        setEditingRecordingId(null);
        setHasUnsavedChanges(false);
      } else {
        showAlertModal("Success", "Recording saved successfully!", "success");
      }
      
      setShowSaveForm(false);
      
      if (!isEditMode || saveOption === "remix") {
        setRecordingTitle("");
        setRecordingDescription("");
      }
    } else {
      const errorText = await response.text();
      console.error("Save failed:", errorText);
      showAlertModal("Save Failed", "Failed to save recording. Please try again.", "error");
    }
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      showAlertModal("Timeout", "Request timeout. Please try again.", "error");
    } else {
      console.error("Save error:", err);
      showAlertModal("Error", "Error saving recording. Please try again.", "error");
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

  return (
    <div className="m-landing-page">
      <header className="m-header">
        <Link to="/" className="m-site-title">
          <span className="material-symbols-outlined m-paw">pets</span>
          <h1 className="m-name">ANIMALBAND</h1>
        </Link>

        <div className="header-buttons">
          {!user ? (
            <>
              <button className="btn-login" onClick={() => navigate("/login")}>
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
        <div style={{
          backgroundColor: '#15803d',
          color: 'white',
          padding: '12px',
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: '14px'
        }}>
          Editing: {recordingTitle || 'Untitled Recording'}
          {hasUnsavedChanges && <span style={{ marginLeft: '10px' }}>• Unsaved Changes</span>}
        </div>
      )}

      <section className="m-band-stage">
        <h2 className="main-heading">Stage</h2>
        <p className="subtitle">Tap on the animals in different quadrants!</p>

        <div className="m-animal-grid">
          {Object.keys(ANIMAL_IMAGES).map((animal) => (
            <div key={animal} className="m-animal-cell">
              <img
                src={
                  playingAnimals[animal]
                    ? ANIMAL_IMAGES[animal][1]
                    : ANIMAL_IMAGES[animal][0]
                }
                alt={animal}
                className={playingAnimals[animal] ? "playing" : ""}
              />
              {ANIMAL_KEYS[animal].map((key, i) => (
                <div
                  key={i}
                  className={`m-quadrant quadrant-${i}`}
                  onClick={() => handleTap(key)}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="master-volume">
          <label
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "8px",
              fontSize: "14px",
              fontWeight: "600",
            }}
          >
            <span>Master Volume</span>
            <span>{(masterVolume * 100).toFixed(0)}%</span>
          </label>
          <style>
            {`
              input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #15803d;
                cursor: pointer;
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              }
              input[type="range"]::-moz-range-thumb {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #15803d;
                cursor: pointer;
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              }
            `}
          </style>
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
            style={{
              width: "100%",
              height: "8px",
              borderRadius: "4px",
              outline: "none",
              background: `linear-gradient(to right, #15803d 0%, #15803d ${
                masterVolume * 100
              }%, #ddd ${masterVolume * 100}%, #ddd 100%)`,
              WebkitAppearance: "none",
              appearance: "none",
            }}
            aria-label="Master Volume"
          />
        </div>

        <div className="record-controls">
          <button
            onClick={toggleRecording}
            disabled={recordedTracks.length >= MAX_TRACKS && !isRecording}
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "10px",
              fontSize: "16px",
              fontWeight: "600",
              border: "2px solid #333",
              borderRadius: "8px",
              backgroundColor: isRecording ? "#ff4444" : "white",
              color: isRecording ? "white" : "#333",
              cursor:
                recordedTracks.length >= MAX_TRACKS && !isRecording
                  ? "not-allowed"
                  : "pointer",
              opacity:
                recordedTracks.length >= MAX_TRACKS && !isRecording ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
            aria-label={isRecording ? "Stop Recording" : "Start Recording"}
          >
            <span style={{ fontSize: "20px" }}>{isRecording ? "■" : "●"}</span>
            {isRecording ? "Stop Recording" : "Start Recording"}
          </button>

          <button
            onClick={isPlaying ? stopPlayback : playAllTracks}
            disabled={isRecording || recordedTracks.length === 0}
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "10px",
              fontSize: "16px",
              fontWeight: "600",
              border: "2px solid #333",
              borderRadius: "8px",
              backgroundColor: "white",
              color: "#333",
              cursor:
                isRecording || recordedTracks.length === 0
                  ? "not-allowed"
                  : "pointer",
              opacity: isRecording || recordedTracks.length === 0 ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
            aria-label={isPlaying ? "Stop Playback" : "Play Recording"}
          >
            <span style={{ fontSize: "20px" }}>{isPlaying ? "■" : "►"}</span>
            {isPlaying ? "Stop" : "Play Recording"}
          </button>

          <button
            onClick={exportRecording}
            disabled={recordedTracks.length === 0}
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "10px",
              fontSize: "16px",
              fontWeight: "600",
              border: "none",
              borderRadius: "8px",
              backgroundColor: recordedTracks.length === 0 ? "#ccc" : "#15803d",
              color: "white",
              cursor: recordedTracks.length === 0 ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
            aria-label="Export Recording"
          >
            <span className="material-symbols-outlined">file_download</span>
            Export
          </button>

          <button
            onClick={() => setShowSaveForm(true)}
            disabled={recordedTracks.length === 0}
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "10px",
              fontSize: "16px",
              fontWeight: "600",
              border: "none",
              borderRadius: "8px",
              backgroundColor: recordedTracks.length === 0 ? "#ccc" : "#15803d",
              color: "white",
              cursor: recordedTracks.length === 0 ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
            aria-label="Save Recording"
          >
            <span className="material-symbols-outlined">save</span>
            Save
          </button>

          <button
            onClick={importAudioTrack}
            disabled={recordedTracks.length >= MAX_TRACKS}
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "10px",
              fontSize: "16px",
              fontWeight: "600",
              border: "2px solid #333",
              borderRadius: "8px",
              backgroundColor: "white",
              color: "#333",
              cursor:
                recordedTracks.length >= MAX_TRACKS ? "not-allowed" : "pointer",
              opacity: recordedTracks.length >= MAX_TRACKS ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
            aria-label="Import Audio Track"
          >
            <span className="material-symbols-outlined">upload</span>
            Import
          </button>

          <button
            onClick={() => setShowTutorial(true)}
            style={{
              width: "100%",
              padding: "12px",
              fontSize: "16px",
              fontWeight: "600",
              border: "2px solid #333",
              borderRadius: "8px",
              backgroundColor: "white",
              color: "#333",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
            aria-label="Show Tutorial"
          >
            <span style={{ fontSize: "20px", fontWeight: "bold" }}>?</span>
            Tutorial
          </button>
        </div>

        {showSaveForm && (
          <div className="modal-overlay" onClick={() => setShowSaveForm(false)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <h3>{isEditMode ? 'Save Your Changes' : 'Save Your Recording'}</h3>
              
              {isEditMode && (
                <div style={{ marginBottom: '15px', padding: '12px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
                  <p style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '14px' }}>Save Options:</p>
                  <label style={{ display: 'block', marginBottom: '10px', cursor: 'pointer', fontSize: '13px' }}>
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
                  <label style={{ display: 'block', cursor: 'pointer', fontSize: '13px' }}>
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

        {showExportForm && (
  <div className="modal-overlay" onClick={() => setShowExportForm(false)}>
    <div className="modal-box" onClick={(e) => e.stopPropagation()}>
      <h3>Export Recording</h3>
      <label>
        Filename:
        <input
          type="text"
          value={exportFileName}
          onChange={(e) => setExportFileName(e.target.value)}
          placeholder="animalband_recording"
          maxLength={50}
          required
          aria-label="Export Filename"
        />
      </label>
      <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
        File will be saved as {sanitizeFilename(exportFileName) || 'unnamed'}.wav
      </p>
      <div className="form-buttons">
        <button onClick={() => setShowExportForm(false)}>
          Cancel
        </button>
        <button onClick={performExport}>
          Export
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
            <div className="modal-box tutorial-modal" onClick={(e) => e.stopPropagation()} style={{
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <div className="modal-header info">
                <h3>How to Use ANIMALBAND</h3>
              </div>
              <div className="modal-content tutorial-content" style={{
                textAlign: 'left',
                fontSize: '14px'
              }}>
                <section style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>Touch Controls</h4>
                  <ul style={{ paddingLeft: '20px', marginBottom: '0' }}>
                    <li style={{ marginBottom: '8px' }}><strong>Tap on animals</strong> to play sounds - each animal has 4 quadrants to tap!</li>
                    <li style={{ marginBottom: '8px' }}><strong>Hamster:</strong> Drums (tap top-left, top-right, bottom-left, bottom-right)</li>
                    <li style={{ marginBottom: '8px' }}><strong>Bird:</strong> Vocal sounds</li>
                    <li style={{ marginBottom: '8px' }}><strong>Ostrich:</strong> Keyboard/Piano</li>
                    <li style={{ marginBottom: '8px' }}><strong>Kangaroo:</strong> Guitar</li>
                    <li style={{ marginBottom: '8px' }}><strong>Snake:</strong> Bass</li>
                  </ul>
                </section>

                <section style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>Control Buttons</h4>
                  <ul style={{ paddingLeft: '20px', marginBottom: '0' }}>
                    <li style={{ marginBottom: '8px' }}><strong>● Start Recording:</strong> Begin recording a new track</li>
                    <li style={{ marginBottom: '8px' }}><strong>■ Stop Recording:</strong> Save your current track</li>
                    <li style={{ marginBottom: '8px' }}><strong>► Play Recording:</strong> Play all your tracks together</li>
                    <li style={{ marginBottom: '8px' }}><strong>Export:</strong> Download your recording as a WAV file</li>
                    <li style={{ marginBottom: '8px' }}><strong>Save:</strong> Save your recording to your account</li>
                    <li style={{ marginBottom: '8px' }}><strong>Import:</strong> Add an audio file as a track</li>
                    <li style={{ marginBottom: '8px' }}><strong>? Tutorial:</strong> Show this help guide</li>
                  </ul>
                </section>

                <section style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>Track Management</h4>
                  <ul style={{ paddingLeft: '20px', marginBottom: '0' }}>
                    <li style={{ marginBottom: '8px' }}><strong>Volume Slider:</strong> Adjust master volume or individual track volumes</li>
                    <li style={{ marginBottom: '8px' }}><strong>Mute:</strong> Temporarily silence a track</li>
                    <li style={{ marginBottom: '8px' }}><strong>Solo:</strong> Play only this track (mutes all others)</li>
                    <li style={{ marginBottom: '8px' }}><strong>Rename:</strong> Double-tap track name or use Rename button</li>
                    <li style={{ marginBottom: '8px' }}><strong>Delete:</strong> Remove a track permanently</li>
                  </ul>
                </section>

                <section>
                  <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>💡 Tips</h4>
                  <ul style={{ paddingLeft: '20px', marginBottom: '0' }}>
                    <li style={{ marginBottom: '8px' }}>Record up to {MAX_TRACKS} tracks total</li>
                    <li style={{ marginBottom: '8px' }}>While recording, existing tracks will play along</li>
                    <li style={{ marginBottom: '8px' }}>You can import audio files (MP3, WAV, OGG, WebM, M4A)</li>
                    <li style={{ marginBottom: '8px' }}>Maximum recording length: {MAX_AUDIO_DURATION / 60} minutes per track</li>
                    <li style={{ marginBottom: '8px' }}>Save your creations to access them later from "My Recordings"</li>
                    <li style={{ marginBottom: '8px' }}>Edit saved recordings by clicking the edit button in "My Recordings"</li>
                  </ul>
                </section>
              </div>
              <div className="form-buttons">
                <button onClick={() => setShowTutorial(false)} className="btn-primary" style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px'
                }}>Got It!</button>
              </div>
            </div>
          </div>
        )}

        <div
          className="tracks-list"
          style={{
            marginTop: "20px",
            padding: "15px",
            backgroundColor: "#f9f9f9",
            borderRadius: "8px",
            maxHeight: "500px",
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          <h3
            style={{
              marginBottom: "15px",
              fontSize: "18px",
              fontWeight: "700",
            }}
          >
            Recorded Tracks ({recordedTracks.length}/{MAX_TRACKS})
          </h3>
          {recordedTracks.length === 0 && (
            <p style={{ textAlign: "center", color: "#666" }}>No tracks yet.</p>
          )}
          {recordedTracks.map((track, index) => (
            <div
              key={index}
              style={{
                backgroundColor: "white",
                padding: "12px",
                marginBottom: "10px",
                borderRadius: "8px",
                border: "1px solid #ddd",
              }}
            >
              <div style={{ marginBottom: "10px" }}>
                {editingTrack === index ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => finishRename(index)}
                    onKeyDown={(e) => e.key === "Enter" && finishRename(index)}
                    autoFocus
                    maxLength={MAX_TRACK_NAME_LENGTH}
                    style={{
                      width: "100%",
                      padding: "6px",
                      fontSize: "14px",
                      fontWeight: "600",
                      border: "2px solid #15803d",
                      borderRadius: "4px",
                      outline: "none",
                    }}
                    aria-label="Track Name"
                  />
                ) : (
                  <div
                    onDoubleClick={() => startRename(index)}
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      marginBottom: "8px",
                      wordBreak: "break-word",
                      cursor: "pointer",
                    }}
                    title="Double-tap to rename"
                  >
                    {trackSettings[index]?.name || `Track ${index + 1}`}
                  </div>
                )}

                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={trackSettings[index]?.volume ?? 1}
                    onChange={(e) => setTrackVolume(index, e.target.value)}
                    style={{
                      flexGrow: 1,
                      height: "6px",
                      borderRadius: "3px",
                      outline: "none",
                      background: `linear-gradient(to right, #15803d 0%, #15803d ${
                        (trackSettings[index]?.volume ?? 1) * 100
                      }%, #ddd ${
                        (trackSettings[index]?.volume ?? 1) * 100
                      }%, #ddd 100%)`,
                      WebkitAppearance: "none",
                      appearance: "none",
                    }}
                    aria-label={`Volume for ${
                      trackSettings[index]?.name || `Track ${index + 1}`
                    }`}
                  />
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      minWidth: "40px",
                      textAlign: "right",
                    }}
                  >
                    {Math.round((trackSettings[index]?.volume ?? 1) * 100)}%
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                }}
              >
                <button
                  onClick={() => toggleMute(index)}
                  style={{
                    padding: "8px",
                    fontSize: "13px",
                    fontWeight: "600",
                    border: "none",
                    borderRadius: "6px",
                    backgroundColor: trackSettings[index]?.muted
                      ? "#ff6b6b"
                      : "#e0e0e0",
                    color: trackSettings[index]?.muted ? "white" : "#333",
                    cursor: "pointer",
                  }}
                  aria-label={
                    trackSettings[index]?.muted ? "Unmute Track" : "Mute Track"
                  }
                >
                  {trackSettings[index]?.muted ? "Unmute" : "Mute"}
                </button>
                <button
                  onClick={() => toggleSolo(index)}
                  style={{
                    padding: "8px",
                    fontSize: "13px",
                    fontWeight: "600",
                    border: "none",
                    borderRadius: "6px",
                    backgroundColor: trackSettings[index]?.solo
                      ? "#15803d"
                      : "#e0e0e0",
                    color: trackSettings[index]?.solo ? "white" : "#333",
                    cursor: "pointer",
                  }}
                  aria-label={
                    trackSettings[index]?.solo ? "Unsolo Track" : "Solo Track"
                  }
                >
                  {trackSettings[index]?.solo ? "Unsolo" : "Solo"}
                </button>
                <button
                  onClick={() => startRename(index)}
                  style={{
                    padding: "8px",
                    fontSize: "13px",
                    fontWeight: "600",
                    border: "none",
                    borderRadius: "6px",
                    backgroundColor: "#e0e0e0",
                    color: "#333",
                    cursor: "pointer",
                  }}
                  aria-label="Rename Track"
                >
                  Rename
                </button>
                <button
                  onClick={() => deleteTrack(index)}
                  style={{
                    padding: "8px",
                    fontSize: "13px",
                    fontWeight: "600",
                    border: "none",
                    borderRadius: "6px",
                    backgroundColor: "#ff6b6b",
                    color: "white",
                    cursor: "pointer",
                  }}
                  aria-label="Delete Track"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
        rel="stylesheet"
      />
    </div>
  );
}