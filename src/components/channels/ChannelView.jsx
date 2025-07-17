import React, { useState, useEffect } from 'react';
import { Users, Settings, UserPlus, Bell, Search, MoreVertical } from 'lucide-react';
import ChannelHeader from './ChannelHeader';
import ChannelMembers from './ChannelMembers';
import ChannelInfoPanel from './ChannelInfoPanel';
import ChatArea from '../chat/ChatArea';

const ChannelView = ({ channel, onBack }) => {
  const [activeTab, setActiveTab] = useState('chat');
  const [showMembers, setShowMembers] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  if (!channel) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Select a Channel
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Choose a channel from the sidebar to start chatting
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
      <ChannelHeader 
        channel={channel}
        onBack={onBack}
        onToggleMembers={() => setShowMembers(!showMembers)}
        onToggleInfo={() => setShowInfo(!showInfo)}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col">
          {activeTab === 'chat' && (
            <ChatArea 
              chatId={channel.id}
              chatType="channel"
              chatName={channel.name}
            />
          )}
        </div>
        
        {showMembers && (
          <div className="w-80 border-l border-gray-200 dark:border-gray-700">
            <ChannelMembers 
              channel={channel}
              onClose={() => setShowMembers(false)}
            />
          </div>
        )}
        
        {showInfo && (
          <div className="w-80 border-l border-gray-200 dark:border-gray-700">
            <ChannelInfoPanel 
              channel={channel}
              onClose={() => setShowInfo(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChannelView;