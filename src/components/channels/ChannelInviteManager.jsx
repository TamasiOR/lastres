import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { 
  UserPlus, 
  Link, 
  Copy, 
  Share, 
  Clock, 
  Users, 
  X, 
  Check, 
  Mail,
  QrCode,
  Settings,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  Calendar,
  Shield
} from 'lucide-react';

export default function ChannelInviteManager({ 
  channel, 
  isOpen, 
  onClose, 
  onInviteMember,
  onUpdateInviteSettings 
}) {
  const [inviteSettings, setInviteSettings] = useState({
    allowInvites: true,
    requireApproval: false,
    maxUses: 0, // 0 = unlimited
    expiresAfter: 7, // days
    allowedRoles: ['member'],
    publicJoin: false
  });

  const [activeInvites, setActiveInvites] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [inviteCode, setInviteCode] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [emailInvites, setEmailInvites] = useState(['']);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (channel) {
      loadInviteData();
    }
  }, [channel]);

  const loadInviteData = () => {
    // Load existing invite settings and active invites
    const savedSettings = localStorage.getItem(`channel-invite-settings-${channel.id}`);
    if (savedSettings) {
      try {
        setInviteSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Error loading invite settings:', error);
      }
    }

    const savedInvites = localStorage.getItem(`channel-invites-${channel.id}`);
    if (savedInvites) {
      try {
        const invites = JSON.parse(savedInvites);
        setActiveInvites(invites.filter(invite => !invite.expired && !invite.revoked));
        setPendingInvites(invites.filter(invite => invite.status === 'pending'));
      } catch (error) {
        console.error('Error loading invites:', error);
      }
    }
  };

  const saveInviteSettings = (settings) => {
    localStorage.setItem(`channel-invite-settings-${channel.id}`, JSON.stringify(settings));
    setInviteSettings(settings);
    if (onUpdateInviteSettings) {
      onUpdateInviteSettings(channel.id, settings);
    }
  };

  const saveInvites = (invites) => {
    localStorage.setItem(`channel-invites-${channel.id}`, JSON.stringify(invites));
  };

  const generateInviteCode = () => {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
  };

  const generateInviteLink = () => {
    const code = generateInviteCode();
    const baseUrl = window.location.origin;
    return `${baseUrl}/invite/${code}`;
  };

  const createInviteLink = () => {
    const newInvite = {
      id: `invite-${Date.now()}`,
      code: generateInviteCode(),
      channelId: channel.id,
      channelName: channel.name,
      createdBy: 'current-user', // In real app, use actual user ID
      createdAt: new Date().toISOString(),
      expiresAt: inviteSettings.expiresAfter > 0 
        ? new Date(Date.now() + inviteSettings.expiresAfter * 24 * 60 * 60 * 1000).toISOString()
        : null,
      maxUses: inviteSettings.maxUses,
      currentUses: 0,
      status: 'active',
      requireApproval: inviteSettings.requireApproval,
      allowedRoles: inviteSettings.allowedRoles,
      customMessage: customMessage.trim() || null
    };

    const updatedInvites = [...activeInvites, newInvite];
    setActiveInvites(updatedInvites);
    saveInvites([...updatedInvites, ...pendingInvites]);
    setInviteCode(newInvite.code);

    toast({
      title: "Invite Link Created! 🔗",
      description: "Your invite link is ready to share"
    });
  };

  const sendEmailInvites = () => {
    const validEmails = emailInvites.filter(email => 
      email.trim() && email.includes('@')
    );

    if (validEmails.length === 0) {
      toast({
        title: "No Valid Emails",
        description: "Please enter at least one valid email address",
        variant: "destructive"
      });
      return;
    }

    const newInvites = validEmails.map(email => ({
      id: `email-invite-${Date.now()}-${Math.random()}`,
      type: 'email',
      email: email.trim(),
      channelId: channel.id,
      channelName: channel.name,
      createdBy: 'current-user',
      createdAt: new Date().toISOString(),
      status: 'sent',
      requireApproval: inviteSettings.requireApproval,
      customMessage: customMessage.trim() || null
    }));

    const updatedPending = [...pendingInvites, ...newInvites];
    setPendingInvites(updatedPending);
    saveInvites([...activeInvites, ...updatedPending]);
    setEmailInvites(['']);

    toast({
      title: "Email Invites Sent! 📧",
      description: `Sent ${validEmails.length} invitation${validEmails.length > 1 ? 's' : ''}`
    });
  };

  const copyInviteLink = (code) => {
    const link = `${window.location.origin}/invite/${code}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Invite Link Copied! 📋",
      description: "Share this link to invite members"
    });
  };

  const shareInviteLink = async (code) => {
    const link = `${window.location.origin}/invite/${code}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${channel.name} on SecureChat`,
          text: customMessage || `You're invited to join ${channel.name}!`,
          url: link
        });
        toast({
          title: "Invite Shared! 📤",
          description: "Invitation has been shared successfully"
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          copyInviteLink(code);
        }
      }
    } else {
      copyInviteLink(code);
    }
  };

  const revokeInvite = (inviteId) => {
    const updatedInvites = activeInvites.map(invite =>
      invite.id === inviteId ? { ...invite, status: 'revoked', revokedAt: new Date().toISOString() } : invite
    );
    setActiveInvites(updatedInvites.filter(invite => invite.status === 'active'));
    saveInvites([...updatedInvites, ...pendingInvites]);

    toast({
      title: "Invite Revoked",
      description: "The invite link has been deactivated"
    });
  };

  const handleSettingChange = (key, value) => {
    const newSettings = { ...inviteSettings, [key]: value };
    saveInviteSettings(newSettings);
  };

  const addEmailField = () => {
    setEmailInvites([...emailInvites, '']);
  };

  const removeEmailField = (index) => {
    setEmailInvites(emailInvites.filter((_, i) => i !== index));
  };

  const updateEmailField = (index, value) => {
    const updated = [...emailInvites];
    updated[index] = value;
    setEmailInvites(updated);
  };

  const formatExpiryDate = (dateString) => {
    if (!dateString) return 'Never expires';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInviteStatus = (invite) => {
    if (invite.status === 'revoked') return { text: 'Revoked', color: 'text-destructive' };
    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
      return { text: 'Expired', color: 'text-muted-foreground' };
    }
    if (invite.maxUses > 0 && invite.currentUses >= invite.maxUses) {
      return { text: 'Used Up', color: 'text-muted-foreground' };
    }
    return { text: 'Active', color: 'text-green-500' };
  };

  if (!isOpen || !channel) return null;

  return (
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
            <UserPlus className="w-5 h-5" />
            <div>
              <h3 className="text-lg font-semibold">Invite Members</h3>
              <p className="text-sm text-muted-foreground">#{channel.name}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Invite Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Invitation Settings
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showAdvanced ? 'Hide' : 'Show'} Advanced
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Allow Invitations</Label>
                  <p className="text-xs text-muted-foreground">Enable member invitations</p>
                </div>
                <Switch
                  checked={inviteSettings.allowInvites}
                  onCheckedChange={(checked) => handleSettingChange('allowInvites', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Require Approval</Label>
                  <p className="text-xs text-muted-foreground">New members need approval</p>
                </div>
                <Switch
                  checked={inviteSettings.requireApproval}
                  onCheckedChange={(checked) => handleSettingChange('requireApproval', checked)}
                />
              </div>
            </div>

            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 border-t border-border pt-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="maxUses">Max Uses (0 = unlimited)</Label>
                      <Input
                        id="maxUses"
                        type="number"
                        min="0"
                        value={inviteSettings.maxUses}
                        onChange={(e) => handleSettingChange('maxUses', parseInt(e.target.value) || 0)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="expiresAfter">Expires After (days)</Label>
                      <Input
                        id="expiresAfter"
                        type="number"
                        min="1"
                        max="365"
                        value={inviteSettings.expiresAfter}
                        onChange={(e) => handleSettingChange('expiresAfter', parseInt(e.target.value) || 7)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">Public Join</Label>
                      <p className="text-xs text-muted-foreground">Allow anyone to join without invite</p>
                    </div>
                    <Switch
                      checked={inviteSettings.publicJoin}
                      onCheckedChange={(checked) => handleSettingChange('publicJoin', checked)}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {inviteSettings.allowInvites && (
            <>
              {/* Create Invite Link */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Link className="w-4 h-4" />
                  Create Invite Link
                </h4>

                <div>
                  <Label htmlFor="customMessage">Custom Message (Optional)</Label>
                  <Input
                    id="customMessage"
                    placeholder="Add a personal message to your invitation..."
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    maxLength={200}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={createInviteLink} className="flex-1">
                    <Link className="w-4 h-4 mr-2" />
                    Generate Invite Link
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => toast({
                      title: "QR Code",
                      description: "QR code generation coming soon!"
                    })}
                  >
                    <QrCode className="w-4 h-4" />
                  </Button>
                </div>

                {inviteCode && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-muted/30 rounded-lg p-4 border"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Latest Invite Link</span>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyInviteLink(inviteCode)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => shareInviteLink(inviteCode)}
                        >
                          <Share className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <code className="text-sm bg-background px-2 py-1 rounded">
                      {window.location.origin}/invite/{inviteCode}
                    </code>
                  </motion.div>
                )}
              </div>

              {/* Email Invitations */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Send Email Invitations
                </h4>

                <div className="space-y-2">
                  {emailInvites.map((email, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        type="email"
                        placeholder="Enter email address"
                        value={email}
                        onChange={(e) => updateEmailField(index, e.target.value)}
                      />
                      {emailInvites.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeEmailField(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={addEmailField}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Email
                  </Button>
                  <Button onClick={sendEmailInvites}>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Invitations
                  </Button>
                </div>
              </div>

              {/* Active Invites */}
              {activeInvites.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Active Invites ({activeInvites.length})
                  </h4>

                  <div className="space-y-2">
                    {activeInvites.map((invite) => {
                      const status = getInviteStatus(invite);
                      return (
                        <div key={invite.id} className="bg-muted/30 rounded-lg p-4 border">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <code className="text-sm bg-background px-2 py-1 rounded">
                                  {invite.code}
                                </code>
                                <span className={`text-xs font-medium ${status.color}`}>
                                  {status.text}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground space-y-1">
                                <p>Created: {new Date(invite.createdAt).toLocaleDateString()}</p>
                                <p>Expires: {formatExpiryDate(invite.expiresAt)}</p>
                                <p>Uses: {invite.currentUses}/{invite.maxUses || '∞'}</p>
                                {invite.customMessage && (
                                  <p>Message: "{invite.customMessage}"</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyInviteLink(invite.code)}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => shareInviteLink(invite.code)}
                              >
                                <Share className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => revokeInvite(invite.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Pending Email Invites */}
              {pendingInvites.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Pending Email Invites ({pendingInvites.length})
                  </h4>

                  <div className="space-y-2">
                    {pendingInvites.map((invite) => (
                      <div key={invite.id} className="bg-muted/30 rounded-lg p-3 border">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{invite.email}</p>
                            <p className="text-xs text-muted-foreground">
                              Sent: {new Date(invite.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-yellow-500/20 text-yellow-600 px-2 py-1 rounded">
                              {invite.status}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toast({
                                title: "Resend Invite",
                                description: "Email invitation resent!"
                              })}
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {!inviteSettings.allowInvites && (
            <div className="text-center py-8">
              <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Invitations Disabled</h3>
              <p className="text-muted-foreground">
                Enable invitations in the settings above to start inviting members
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}