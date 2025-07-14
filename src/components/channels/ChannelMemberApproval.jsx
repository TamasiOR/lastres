import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { 
  UserCheck, 
  UserX, 
  Clock, 
  Mail, 
  MessageSquare, 
  X, 
  Check, 
  Eye,
  Shield,
  AlertCircle,
  Search,
  Filter
} from 'lucide-react';

export default function ChannelMemberApproval({ 
  channel, 
  isOpen, 
  onClose, 
  onApproveMember,
  onRejectMember 
}) {
  const [pendingMembers, setPendingMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, approved, rejected
  const [selectedMember, setSelectedMember] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    if (channel) {
      loadPendingMembers();
    }
  }, [channel]);

  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const loadPendingMembers = () => {
    // Load pending member requests
    const savedRequests = localStorage.getItem(`channel-member-requests-${channel.id}`);
    if (savedRequests) {
      try {
        const requests = JSON.parse(savedRequests);
        setPendingMembers(requests);
      } catch (error) {
        console.error('Error loading member requests:', error);
      }
    } else {
      // Demo data for pending members
      const demoRequests = [
        {
          id: 'req-1',
          userId: 'user-1',
          username: 'John Doe',
          email: 'john@example.com',
          avatar: '👨‍💼',
          requestedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
          inviteCode: 'ABC123',
          message: 'Hi! I would love to join this channel to collaborate on the project.',
          invitedBy: 'Alice Cooper'
        },
        {
          id: 'req-2',
          userId: 'user-2',
          username: 'Sarah Johnson',
          email: 'sarah@example.com',
          avatar: '👩‍🎨',
          requestedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
          inviteCode: 'DEF456',
          message: 'Looking forward to contributing to the discussions here!',
          invitedBy: 'Bob Wilson'
        },
        {
          id: 'req-3',
          userId: 'user-3',
          username: 'Mike Chen',
          email: 'mike@example.com',
          avatar: '👨‍💻',
          requestedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'approved',
          inviteCode: 'GHI789',
          message: 'Excited to be part of this community!',
          approvedAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
          approvedBy: 'current-user'
        }
      ];
      setPendingMembers(demoRequests);
      localStorage.setItem(`channel-member-requests-${channel.id}`, JSON.stringify(demoRequests));
    }
  };

  const saveMemberRequests = (requests) => {
    localStorage.setItem(`channel-member-requests-${channel.id}`, JSON.stringify(requests));
    setPendingMembers(requests);
  };

  const handleApproveMember = (memberId) => {
    const updatedRequests = pendingMembers.map(request =>
      request.id === memberId
        ? {
            ...request,
            status: 'approved',
            approvedAt: new Date().toISOString(),
            approvedBy: 'current-user'
          }
        : request
    );

    saveMemberRequests(updatedRequests);

    if (onApproveMember) {
      const member = pendingMembers.find(r => r.id === memberId);
      onApproveMember(member);
    }

    toast({
      title: "Member Approved! ✅",
      description: "The member has been approved and can now access the channel"
    });
  };

  const handleRejectMember = (memberId, reason = '') => {
    const updatedRequests = pendingMembers.map(request =>
      request.id === memberId
        ? {
            ...request,
            status: 'rejected',
            rejectedAt: new Date().toISOString(),
            rejectedBy: 'current-user',
            rejectionReason: reason
          }
        : request
    );

    saveMemberRequests(updatedRequests);

    if (onRejectMember) {
      const member = pendingMembers.find(r => r.id === memberId);
      onRejectMember(member, reason);
    }

    setShowRejectModal(false);
    setSelectedMember(null);
    setRejectionReason('');

    toast({
      title: "Member Rejected",
      description: "The member request has been rejected"
    });
  };

  const openRejectModal = (member) => {
    setSelectedMember(member);
    setShowRejectModal(true);
  };

  const filteredMembers = pendingMembers.filter(member => {
    const matchesSearch = member.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || member.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-500/20';
      case 'approved': return 'text-green-600 bg-green-500/20';
      case 'rejected': return 'text-red-600 bg-red-500/20';
      default: return 'text-gray-600 bg-gray-500/20';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-3 h-3" />;
      case 'approved': return <Check className="w-3 h-3" />;
      case 'rejected': return <X className="w-3 h-3" />;
      default: return <AlertCircle className="w-3 h-3" />;
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now - time;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  const pendingCount = pendingMembers.filter(m => m.status === 'pending').length;

  if (!isOpen || !channel) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-card border border-border rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card z-10">
            <div className="flex items-center gap-3">
              <UserCheck className="w-5 h-5" />
              <div>
                <h3 className="text-lg font-semibold">Member Approval</h3>
                <p className="text-sm text-muted-foreground">
                  #{channel.name} • {pendingCount} pending
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="p-6 space-y-6">
            {/* Search and Filter */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            {/* Member Requests */}
            {filteredMembers.length > 0 ? (
              <div className="space-y-4">
                {filteredMembers.map((member) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-muted/30 rounded-lg p-4 border"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-xl">
                        {member.avatar}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{member.username}</h4>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                            {getStatusIcon(member.status)}
                            {member.status}
                          </span>
                        </div>
                        
                        <div className="space-y-1 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-2">
                            <Mail className="w-3 h-3" />
                            <span>{member.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            <span>Requested {formatTimeAgo(member.requestedAt)}</span>
                          </div>
                          {member.invitedBy && (
                            <div className="flex items-center gap-2">
                              <UserCheck className="w-3 h-3" />
                              <span>Invited by {member.invitedBy}</span>
                            </div>
                          )}
                          {member.inviteCode && (
                            <div className="flex items-center gap-2">
                              <Shield className="w-3 h-3" />
                              <span>Invite code: {member.inviteCode}</span>
                            </div>
                          )}
                        </div>
                        
                        {member.message && (
                          <div className="bg-background/50 rounded-lg p-3 mb-3">
                            <div className="flex items-center gap-2 mb-1">
                              <MessageSquare className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs font-medium text-muted-foreground">Message</span>
                            </div>
                            <p className="text-sm">{member.message}</p>
                          </div>
                        )}

                        {member.status === 'approved' && member.approvedAt && (
                          <div className="text-xs text-green-600">
                            Approved {formatTimeAgo(member.approvedAt)} by {member.approvedBy}
                          </div>
                        )}

                        {member.status === 'rejected' && member.rejectedAt && (
                          <div className="text-xs text-red-600">
                            Rejected {formatTimeAgo(member.rejectedAt)} by {member.rejectedBy}
                            {member.rejectionReason && (
                              <div className="mt-1 text-muted-foreground">
                                Reason: {member.rejectionReason}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {member.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openRejectModal(member)}
                            className="text-destructive hover:text-destructive"
                          >
                            <UserX className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApproveMember(member.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <UserCheck className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <UserCheck className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {searchQuery || filterStatus !== 'all' ? 'No matching requests' : 'No pending requests'}
                </h3>
                <p className="text-muted-foreground">
                  {searchQuery || filterStatus !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'All member requests have been processed'
                  }
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Rejection Modal */}
      <AnimatePresence>
        {showRejectModal && selectedMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-60 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-lg w-full max-w-md"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="text-lg font-semibold">Reject Member Request</h3>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowRejectModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="p-4 space-y-4">
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-lg">
                    {selectedMember.avatar}
                  </div>
                  <div>
                    <p className="font-medium">{selectedMember.username}</p>
                    <p className="text-sm text-muted-foreground">{selectedMember.email}</p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="rejectionReason">Reason for rejection (optional)</Label>
                  <Input
                    id="rejectionReason"
                    placeholder="Provide a reason for the rejection..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    maxLength={200}
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowRejectModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="flex-1"
                    onClick={() => handleRejectMember(selectedMember.id, rejectionReason)}
                  >
                    <UserX className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}