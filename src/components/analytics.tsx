"use client";

import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, ChartData, ChartOptions, LinearScale, TimeScale, PointElement, LineElement } from 'chart.js';
import axios from 'axios';
import pusher from "@/lib/pusher.ts";
import 'chartjs-adapter-date-fns';

Chart.register(TimeScale, LinearScale, PointElement, LineElement);

const AnalyticsSection: React.FC = () => {
    const [chartData, setChartData] = useState<ChartData<'line'>>({
        labels: [],
        datasets: [
            {
                label: 'Viewers',
                data: [],
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: true,
            },
        ],
    });

    const [metrics, setMetrics] = useState({
        totalViewers: 0,
        totalStreams: 0,
    });

    useEffect(() => {
        let onlineUsers = 0;

        const channel = pusher.subscribe('presence-channel');
        channel.bind('pusher:subscription_succeeded', (members: any) => {
            onlineUsers = members.count;
        });

        channel.bind('pusher:member_added', (member: any) => {
            onlineUsers++;
        });

        channel.bind('pusher:member_removed', (member: any) => {
            onlineUsers--;
        });

        const updateChartData = () => {
            const now = new Date();

            setChartData((prev) => ({
                ...prev,
                labels: [...prev.labels || [], now],
                datasets: [
                    {
                        ...prev.datasets[0],
                        data: [...prev.datasets[0].data, onlineUsers],
                    },
                ],
            }));

            setMetrics({
                totalViewers: onlineUsers,
                totalStreams: 0
            })
        };

        // Fetch initial data
        const fetchInitialData = async () => {
            try {
                const response = await axios.get('/api/analytics/initial-data');
                setChartData(response.data.chartData);
                setMetrics(response.data.metrics);
            } catch (error) {
                console.error('Failed to fetch initial data', error);
            }
        };

        fetchInitialData();

        // Set up interval to update chart data every 60 seconds
        const intervalId = setInterval(updateChartData, 10000);

        return () => {
            pusher.unsubscribe('presence-channel');
            clearInterval(intervalId);
        };
    }, []);

    const options: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'minute',
                },
            },
            y: {
                beginAtZero: true,
            },
        },
        backgroundColor: '#fff',
        color: '#fff',
        layout: {
            autoPadding: true
        },
        animation: {
            loop: true,
            duration: 1.5
        },
        locale: 'cs',
        elements: {
            line: {
                backgroundColor: '#fff'
            }
        }
    };

    return (
        <div className="p-6 rounded-lg shadow-md bg-gray-800 text-gray-200">
            <h2 className="text-2xl font-bold mb-4">Analytics</h2>
            <div className="mb-4">
                <p>Total Viewers: {metrics.totalViewers}</p>
                <p>Total Streams: {metrics.totalStreams}</p>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg shadow-md" style={{ width: '100%', overflowX: 'auto' }}>
                <h3 className="text-xl font-semibold mb-4">Real-time Viewers</h3>
                <div style={{ width: '1400px', height: '400px', color: '#fff' }}>
                    <Line data={chartData} options={options} />
                </div>
            </div>
        </div>
    );
};

export default AnalyticsSection;
