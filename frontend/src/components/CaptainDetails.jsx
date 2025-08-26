import React, { useContext, useEffect, useState } from 'react';
import { CaptainDataContext } from '../context/CapatainContext';
import axios from 'axios';

const CaptainDetails = () => {
    const { captain } = useContext(CaptainDataContext);
    const [stats, setStats] = useState({
        totalEarnings: 0,
        totalRides: 0,
        totalDistance: 0,
        hoursOnline: 0
    });

    useEffect(() => {
        const fetchCaptainStats = async () => {
            if (!captain?._id) return;

            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_BASE_URL}/captains/stats/${captain._id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`
                        }
                    }
                );
                setStats(response.data.stats);
            } catch (error) {
                console.error('Error fetching captain stats:', error);
            }
        };

        fetchCaptainStats();
    }, [captain]);

    // Show loading state if captain data is not available
    if (!captain || !captain.fullname) {
        return (
            <div>
                <div className='flex items-center justify-between'>
                    <div className='flex items-center justify-start gap-3'>
                        <div className='h-10 w-10 rounded-full bg-gray-200 animate-pulse'></div>
                        <div className='space-y-2'>
                            <div className='h-4 w-24 bg-gray-200 rounded animate-pulse'></div>
                        </div>
                    </div>
                    <div>
                        <div className='h-6 w-20 bg-gray-200 rounded animate-pulse mb-1'></div>
                        <div className='h-4 w-16 bg-gray-200 rounded animate-pulse'></div>
                    </div>
                </div>
                <div className='flex p-3 mt-8 bg-gray-100 rounded-xl justify-center gap-5 items-start'>
                    {/* Loading skeleton for stats */}
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className='flex items-center justify-between'>
                <div className='flex items-center justify-start gap-3'>
                    <img 
                        className='h-10 w-10 rounded-full object-cover' 
                        src={captain.profilePic || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRdlMd7stpWUCmjpfRjUsQ72xSWikidbgaI1w&s"} 
                        alt={`${captain.fullname.firstname}'s profile`} 
                    />
                    <div>
                        <h4 className='text-lg font-medium capitalize'>
                            {captain.fullname.firstname} {captain.fullname.lastname}
                        </h4>
                        <p className='text-sm text-gray-600'>{captain.vehicleType}</p>
                    </div>
                </div>
                <div>
                    <h4 className='text-xl font-semibold'>Rs {stats.totalEarnings.toFixed(2)}</h4>
                    <p className='text-sm text-gray-600'>Total Earned</p>
                </div>
            </div>
            <div className='flex p-3 mt-8 bg-gray-100 rounded-xl justify-center gap-5 items-start'>
                <div className='text-center'>
                    <i className="text-3xl mb-2 font-thin ri-timer-2-line"></i>
                    <h5 className='text-lg font-medium'>{stats.hoursOnline}</h5>
                    <p className='text-sm text-gray-600'>Hours Online</p>
                </div>
                <div className='text-center'>
                    <i className="text-3xl mb-2 font-thin ri-speed-up-line"></i>
                    <h5 className='text-lg font-medium'>{stats.totalDistance}km</h5>
                    <p className='text-sm text-gray-600'>Total Distance</p>
                </div>
                <div className='text-center'>
                    <i className="text-3xl mb-2 font-thin ri-booklet-line"></i>
                    <h5 className='text-lg font-medium'>{stats.totalRides}</h5>
                    <p className='text-sm text-gray-600'>Total Rides</p>
                </div>
            </div>
        </div>
    );
};

export default CaptainDetails;