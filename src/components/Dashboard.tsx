import React, { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { ChartOptions } from 'chart.js';

Chart.register(...registerables);

interface StressDataPoint {
  date: string;
  isStressed: boolean;
}

const Dashboard = () => {
  const [isStressed, setIsStressed] = useState<boolean>(false);
  const [isMonitoring, setIsMonitoring] = useState<boolean>(false);
  const [stressHistory, setStressHistory] = useState<StressDataPoint[]>([]);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [audioStatus, setAudioStatus] = useState<string>('Not active');
  const [showFeedbackForm, setShowFeedbackForm] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize with sample data
  useEffect(() => {
    const initialData: StressDataPoint[] = [
      { date: 'Mon', isStressed: false },
      { date: 'Tue', isStressed: true },
      { date: 'Wed', isStressed: false },
      { date: 'Thu', isStressed: false },
      { date: 'Fri', isStressed: true },
      { date: 'Sat', isStressed: false },
      { date: 'Sun', isStressed: false },
    ];
    setStressHistory(initialData);
  }, []);

  const requestCameraAccess = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setMediaStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      return true;
    } catch (err) {
      setError('Camera access denied');
      return false;
    }
  };

  const requestMicrophoneAccess = async (): Promise<boolean> => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStatus('Active');
      return true;
    } catch (err) {
      setError('Microphone access denied');
      return false;
    }
  };

  const startMonitoring = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const cameraGranted = await requestCameraAccess();
      if (!cameraGranted) {
        setIsMonitoring(false);
        return;
      }

      const micGranted = await requestMicrophoneAccess();
      if (!micGranted) {
        setIsMonitoring(false);
        return;
      }

      setIsMonitoring(true);
      simulateStressDetection();
    } catch (err) {
      setError('Failed to start monitoring');
    } finally {
      setIsLoading(false);
    }
  };

  const stopMonitoring = (): void => {
    setIsMonitoring(false);
    
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
    
    setAudioStatus('Not active');
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const simulateStressDetection = (): NodeJS.Timeout => {
    return setInterval(() => {
      if (!isMonitoring) return;
      
      const detectedStress = Math.random() < 0.4;
      setIsStressed(detectedStress);
      
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const today = days[new Date().getDay()];
      const timeStamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      
      setStressHistory(prev => [
        ...prev, 
        { date: `${today} ${timeStamp}`, isStressed: detectedStress }
      ]);
      
      if (detectedStress) {
        showStressNotification();
        setShowFeedbackForm(true);
      }
    }, 10000);
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isMonitoring) {
      intervalId = simulateStressDetection();
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isMonitoring]);

  const showStressNotification = (): void => {
    const notification = document.getElementById('notification');
    if (notification) {
      notification.classList.add('show');
      setTimeout(() => {
        notification.classList.remove('show');
      }, 5000);
    }
    
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification('Stress Alert', {
        body: 'You appear to be stressed. Consider taking a break.',
      });
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission().catch(err => {
          console.error('Notification permission error:', err);
        });
      }
    }
  }, []);

  const submitFeedback = (rating: number): void => {
    if (rating < 1 || rating > 5) return;
    setFeedback(rating);
    setShowFeedbackForm(false);
    console.log(`User feedback: ${rating}/5`);
  };

  // Chart configuration
  const chartData = {
    labels: stressHistory.map(item => item.date),
    datasets: [
      {
        label: 'Stress Status',
        data: stressHistory.map(item => item.isStressed ? 1 : 0),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        stepped: true,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 1,
        ticks: {
          stepSize: 1,
          callback: function(value: number | string) {
            if (typeof value === 'number') {
              return value === 0 ? 'Not Stressed' : 'Stressed';
            }
            return value;
          }
        }
      },
      x: {
        ticks: {
          autoSkip: true,
          maxRotation: 0,
          minRotation: 0
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return context.parsed.y === 0 ? 'Not Stressed' : 'Stressed';
          }
        }
      }
    }
  };  

  return (
    <div className="stress-detection-tool">
      <h1>Stress Detection Tool</h1>
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
      
      <div className="monitoring-controls">
        <button 
          className={`start-button ${isMonitoring ? 'disabled' : ''}`}
          onClick={startMonitoring}
          disabled={isMonitoring || isLoading}
          aria-label={isLoading ? 'Starting monitoring...' : 'Start monitoring'}
        >
          {isLoading ? 'Starting...' : 'Start Monitoring'}
        </button>
        
        <button 
          className={`stop-button ${!isMonitoring ? 'disabled' : ''}`}
          onClick={stopMonitoring}
          disabled={!isMonitoring}
          aria-label="Stop monitoring"
        >
          Stop Monitoring
        </button>
      </div>
      
      <div className="dashboard-content">
        <div className="live-feed-container">
          <h3>Live Video Feed</h3>
          <div className="video-container">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted
              aria-label="Live camera feed"
              onError={() => setError('Video feed error')}
            />
            {!isMonitoring && (
              <div className="video-overlay" aria-hidden="true">
                Monitoring inactive
              </div>
            )}
          </div>
        </div>
        
        <div className="status-container">
          <div className="audio-status">
            <h3>Live Audio Status</h3>
            <div className={`status-indicator ${audioStatus === 'Active' ? 'active' : 'inactive'}`}>
              <span className="status-dot" aria-hidden="true"></span>
              <span>{audioStatus}</span>
            </div>
          </div>
          
          <div className="stress-status">
            <h3>Stress Status Indicator</h3>
            <div className={`status-indicator ${isStressed ? 'stressed' : 'not-stressed'}`}>
              <span className="status-dot" aria-hidden="true"></span>
              <span>{isStressed ? 'Stressed' : 'Not Stressed'}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="chart-container">
        <h3>Stress History</h3>
        <div className="chart-wrapper">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>
      
      <div id="notification" className="notification">
        <div className="notification-content">
          <h3>Alert: Stress Detected</h3>
          <p>You appear to be experiencing stress. Consider taking a break or a few deep breaths.</p>
          <button 
            onClick={() => setShowFeedbackForm(true)}
            aria-label="Provide feedback about stress level"
          >
            Provide Feedback
          </button>
        </div>
      </div>
      
      {showFeedbackForm && (
        <div className="feedback-overlay">
          <div className="feedback-form" role="dialog" aria-modal="true" aria-labelledby="feedback-heading">
            <h3 id="feedback-heading">Rate your actual stress level</h3>
            <p>On a scale of 1-5, how stressed are you feeling?</p>
            <div className="rating-buttons">
              {[1, 2, 3, 4, 5].map(rating => (
                <button 
                  key={rating} 
                  onClick={() => submitFeedback(rating)}
                  className="rating-button"
                  aria-label={`Rate stress level ${rating}`}
                >
                  {rating}
                </button>
              ))}
            </div>
            <button 
              className="close-button" 
              onClick={() => setShowFeedbackForm(false)}
              aria-label="Close feedback form"
            >
              Close
            </button>
          </div>
        </div>
      )}
      
      {feedback !== null && (
        <div className="data-summary">
          <h3>Stored Data Summary</h3>
          <p>Latest feedback: {feedback}/5</p>
          <p>Total stress instances: {stressHistory.filter(item => item.isStressed).length}</p>
          <p>Total monitoring sessions: {stressHistory.length}</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;