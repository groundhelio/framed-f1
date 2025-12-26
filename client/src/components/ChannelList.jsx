import { useState } from 'react';
import { X, Search } from 'lucide-react';

const ChannelList = ({
    channels,
    onSelectChannel,
    activeChannel,
    onClose,
    categories,
    selectedCategory,
    onSelectCategory
}) => {
    const [filter, setFilter] = useState('');

    const filteredChannels = channels.filter(ch =>
        ch.name.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h2>Channels ({filteredChannels.length})</h2>
                <button className="icon-btn" onClick={onClose} title="Close Sidebar">
                    <X size={20} />
                </button>
            </div>

            <div className="categories-wrapper">
                {categories.map((cat, idx) => (
                    <button
                        key={idx}
                        className={`category-chip ${selectedCategory?.name === cat.name ? 'active' : ''}`}
                        onClick={() => onSelectCategory(cat)}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>

            <div style={{ padding: '0 0.5rem 0.5rem' }}>
                <div className="search-bar">
                    <Search size={16} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Filter..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>
            </div>
            <div className="channel-list">
                {filteredChannels.map((channel, idx) => (
                    <div
                        key={`${channel.name}-${idx}`}
                        className={`channel-item ${activeChannel?.url === channel.url ? 'active' : ''}`}
                        onClick={() => onSelectChannel(channel)}
                    >
                        {channel.logo && (
                            <img
                                src={channel.logo}
                                alt={channel.name}
                                className="channel-logo"
                                onError={(e) => e.target.style.display = 'none'}
                            />
                        )}
                        <span className="channel-name">{channel.name}</span>
                    </div>
                ))}
                {filteredChannels.length === 0 && (
                    <div style={{ padding: '20px', color: '#666', textAlign: 'center', fontSize: '0.9rem' }}>
                        No channels found
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChannelList;
