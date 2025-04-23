import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { Button, Box, Typography, CircularProgress } from '@mui/material';
import { toast } from 'react-toastify';

Chart.register(...registerables);

const Dashboard: React.FC = () => {
  const [stressLevel, setStressLevel] = useState<number | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [stressHistory, setStressHistory] = useState<{date: string, level: number}[]>([]);

  // Sample weekly data
  useEffect(() => {
    setStressHistory([
      { date: 'Mon', level: 30 },
      { date: 'Tue', level: 45 },
      { date: 'Wed', level: 60 },
      { date: 'Thu', level: 25 },
      { date: 'Fri', level: 70 },
      { date: 'Sat', level: 20 },
      { date: 'Sun', level: 35 },
    ]);
  }, []);

  const requestCameraAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setMediaStream(stream);
      return true;
    } catch (err) {
      toast.error('Camera access denied');
      return false;
    }
  };

  const requestMicrophoneAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Add microphone stream to existing video stream if needed
      return true;
    } catch (err) {
      toast.error('Microphone access denied');
      return false;
    }
  };

  const startStressDetection = async () => {
    setIsDetecting(true);
    
    const cameraGranted = await requestCameraAccess();
    if (!cameraGranted) {
      setIsDetecting(false);
      return;
    }

    const micGranted = await requestMicrophoneAccess();
    if (!micGranted) {
      setIsDetecting(false);
      return;
    }

    // Start detection process
    simulateStressDetection();
  };

  const simulateStressDetection = () => {
    // This would be replaced with actual detection logic
    setTimeout(() => {
      const detectedStress = Math.floor(Math.random() * 100);
      setStressLevel(detectedStress);
      
      // Add to history
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const today = days[new Date().getDay()];
      setStressHistory(prev => [...prev, { date: today, level: detectedStress }]);
      
      // Show notification if stressed (threshold > 70)
      if (detectedStress > 70) {
        toast.warning(`You seem stressed! Current level: ${detectedStress}%`);
        
        // Desktop notification
        if (Notification.permission === 'granted') {
          new Notification('Stress Alert', {
            body: `You seem stressed (${detectedStress}%). Consider taking a break.`,
          });
        }
      }
      
      setIsDetecting(false);
    }, 5000);
  };

  // Request notification permission on component mount
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  const chartData = {
    labels: stressHistory.map(item => item.date),
    datasets: [
      {
        label: 'Stress Level (%)',
        data: stressHistory.map(item => item.level),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Stress Dashboard
      </Typography>
      
      <Box sx={{ height: 300, mb: 4 }}>
        <Line data={chartData} options={{ responsive: true }} />
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          variant="contained"
          onClick={startStressDetection}
          disabled={isDetecting}
        >
          {isDetecting ? 'Detecting...' : 'Detect Stress'}
        </Button>
        
        {isDetecting && <CircularProgress size={24} />}
        
        {stressLevel !== null && (
          <Typography variant="h6">
            Current Stress Level: {stressLevel}%
          </Typography>
        )}
      </Box>
      
      {/* Stress indicator visualization */}
      {stressLevel !== null && (
        <Box sx={{ mt: 3, width: '100%', height: 20, backgroundColor: '#ddd', borderRadius: 10 }}>
          <Box
            sx={{
              width: `${stressLevel}%`,
              height: '100%',
              backgroundColor: stressLevel > 70 ? '#f44336' : stressLevel > 40 ? '#ff9800' : '#4caf50',
              borderRadius: 10,
              transition: 'width 0.5s ease',
            }}
          />
        </Box>
      )}
    </Box>
  );
};


export default Dashboard;