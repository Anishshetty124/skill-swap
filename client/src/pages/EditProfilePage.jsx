import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import UpdateEmailModal from '../components/profile/UpdateEmailModal';
import ImageCropModal from '../components/profile/ImageCropModal';
import { XMarkIcon } from '@heroicons/react/24/solid';

const SkillTagInput = ({ title, skills, setSkills }) => {
    const [inputValue, setInputValue] = useState('');

    const handleAddSkill = () => {
        const newSkill = inputValue.trim();
        if (newSkill && !skills.includes(newSkill)) {
            setSkills([...skills, newSkill]);
        }
        setInputValue(''); 
    };

    const handleRemoveSkill = (skillToRemove) => {
        setSkills(skills.filter(skill => skill !== skillToRemove));
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddSkill();
        }
    };

    return (
        <div>
            <label className="block text-sm font-medium">{title}</label>
            <div className="flex items-center gap-2 mt-1">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a skill and press Enter"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 rounded-md"
                />
                <button type="button" onClick={handleAddSkill} className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600">Add</button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
                {skills.map((skill, index) => (
                    <div key={index} className="flex items-center gap-2 bg-slate-200 dark:bg-slate-600 text-sm rounded-full px-3 py-1">
                        <span>{skill}</span>
                        <button type="button" onClick={() => handleRemoveSkill(skill)}>
                            <XMarkIcon className="h-4 w-4 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

const EditProfilePage = () => {
  const { user, updateUserState, logout } = useAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [mobileNumber, setMobileNumber] = useState(user?.mobileNumber || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [locationString, setLocationString] = useState(user?.locationString || '');
  const [socials, setSocials] = useState(user?.socials || { github: '', linkedin: '', website: '' });
  const [skillsToTeach, setSkillsToTeach] = useState(user?.skillsToTeach || []);
  const [skillsToLearn, setSkillsToLearn] = useState(user?.skillsToLearn || []);
  const [avatarFile, setAvatarFile] = useState(null);
  const [isAvatarMarkedForDeletion, setIsAvatarMarkedForDeletion] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setUsername(user.username || '');
      setMobileNumber(user.mobileNumber || '');
      setBio(user.bio || '');
      setLocationString(user.locationString || '');
      setSocials(user.socials || { github: '', linkedin: '', website: '' });
      setSkillsToTeach(user.skillsToTeach || []);
      setSkillsToLearn(user.skillsToLearn || []);
    }
  }, [user]);

   const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => setImageToCrop(reader.result?.toString() || ''));
      reader.readAsDataURL(e.target.files[0]);
      setIsCropModalOpen(true);
    }
  };

  const onCropComplete = (croppedBlob) => {
    const croppedFile = new File([croppedBlob], "newAvatar.jpeg", { type: "image/jpeg" });
    setAvatarFile(croppedFile);
    setIsAvatarMarkedForDeletion(false);
  };

  const handleSocialsChange = (e) => {
    setSocials({ ...socials, [e.target.name]: e.target.value });
  };

  const handleRemoveAvatar = () => {
    if (window.confirm('Are you sure you want to remove your profile picture? This will be saved when you submit your changes.')) {
      setIsAvatarMarkedForDeletion(true);
      setAvatarFile(null);
    }
  };

  const handleChangePasswordClick = async () => {
    if (window.confirm('A password reset code will be sent to your email. Do you want to continue?')) {
      try {
        await apiClient.post('/users/forgot-password', { email: user.email });
        toast.success("Password reset OTP sent to your email.");
        navigate('/reset-password', { state: { email: user.email } });
      } catch (err) {
        toast.error("Failed to send reset email. Please try again.");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updatedData = { 
        username, 
        firstName, 
        lastName, 
        mobileNumber, 
        bio, 
        locationString, 
        socials,
        skillsToTeach,
        skillsToLearn 
      };
      
      const response = await apiClient.patch('/users/me', updatedData);
      
      const updatedUser = response.data.data;
      
      updateUserState(updatedUser);
      toast.success('Profile details saved!');
      
      navigate(`/profile/${updatedUser.username}`);

      if (isAvatarMarkedForDeletion) {
        const avatarResponse = await apiClient.delete('/users/me/avatar');
        updateUserState(avatarResponse.data.data);
        toast.success('Profile picture removed.');
      } else if (avatarFile) {
        const toastId = toast.loading('Uploading profile picture...', { closeButton: true, autoClose: 4500, draggable: true, draggablePercent: 40, pauseOnHover: true, theme: "colored" });
        const formData = new FormData();
        formData.append('file', avatarFile);
        formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
        
        const cloudinaryRes = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`, { method: 'POST', body: formData });
        const cloudinaryData = await cloudinaryRes.json();
        
        if (!cloudinaryData.secure_url) {
            throw new Error("Image upload failed.");
        }

        const avatarUpdateRes = await apiClient.patch('/users/me/avatar', { avatarUrl: cloudinaryData.secure_url });
        updateUserState(avatarUpdateRes.data.data);
        window.location.reload();
        toast.update(toastId, { render: "Profile picture updated!", type: "success", isLoading: false, autoClose: 2000 });
      }
    } catch (err) {
      console.error("Profile Update Error:", err); 
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const getAvatarPreview = () => {
    if (avatarFile) return URL.createObjectURL(avatarFile);
    if (isAvatarMarkedForDeletion) return `https://api.dicebear.com/8.x/initials/svg?seed=${firstName} ${lastName}`;
    return user?.profilePicture || `https://api.dicebear.com/8.x/initials/svg?seed=${firstName} ${lastName}`;
  };

  return (
      <>
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto p-8 bg-gray-100 dark:bg-slate-800 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center mb-6">Edit Your Profile</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center space-x-6">
            <img 
              className="w-24 h-24 rounded-full object-cover"
              src={getAvatarPreview()}
              alt="Profile Preview"
            />
            <div className="flex flex-col gap-4">
              <label htmlFor="avatar-upload" className="cursor-pointer bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-4 py-2 rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 text-center">Change Picture</label>
              <input id="avatar-upload" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              {(user?.profilePicture || avatarFile) && !isAvatarMarkedForDeletion && (
                <button type="button" onClick={handleRemoveAvatar} className="bg-red-500 text-white text-sm px-4 py-2 rounded-md hover:bg-red-600">Remove</button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
         <ImageCropModal 
        isOpen={isCropModalOpen}
        onClose={() => setIsCropModalOpen(false)}
        imageSrc={imageToCrop}
        onCropComplete={onCropComplete}
        />
            <div>
              <label className="block text-sm font-medium">First Name</label>
              <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="w-full px-3 py-2 mt-1 bg-white dark:bg-slate-700 rounded-md"/>
            </div>
            <div>
              <label className="block text-sm font-medium">Last Name</label>
              <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="w-full px-3 py-2 mt-1 bg-white dark:bg-slate-700 rounded-md"/>
          </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className="w-full px-3 py-2 mt-1 bg-white dark:bg-slate-700 rounded-md"/>
          </div>
           <div>
            <label className="block text-sm font-medium">Email Address</label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-1">
              <p className="flex-grow px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-md break-all whitespace-pre-wrap">
                {user?.email}
              </p>
              <button 
                type="button" 
                onClick={() => setIsEmailModalOpen(true)}
                className="px-4 py-2 text-sm font-semibold bg-blue-200 dark:bg-slate-600 rounded-md hover:bg-slate-300 flex-shrink-0"
              >
                Change
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Mobile Number</label>
            <input type="tel" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} placeholder="10-digit mobile number" pattern="[0-9]{10}" className="w-full px-3 py-2 mt-1 bg-white dark:bg-slate-700 rounded-md"/>
          </div>
          <div>
            <label className="block text-sm font-medium">Bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows="4" className="w-full px-3 py-2 mt-1 bg-white dark:bg-slate-700 rounded-md"></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium">Location</label>
            <input type="text" placeholder="e.g., San Francisco, CA" value={locationString} onChange={(e) => setLocationString(e.target.value)} className="w-full px-3 py-2 mt-1 bg-white dark:bg-slate-700 rounded-md"/>
          </div>
          <div className="border-t dark:border-slate-700 pt-6">
            <h2 className="text-xl font-semibold mb-4">Social Links</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium">GitHub URL</label>
                <input type="url" name="github" value={socials.github} onChange={handleSocialsChange} className="w-full px-3 py-2 mt-1 bg-white dark:bg-slate-700 rounded-md"/>
              </div>
              <div>
                <label className="block text-sm font-medium">LinkedIn URL</label>
                <input type="url" name="linkedin" value={socials.linkedin} onChange={handleSocialsChange} className="w-full px-3 py-2 mt-1 bg-white dark:bg-slate-700 rounded-md"/>
              </div>
              <div>
                <label className="block text-sm font-medium">Personal Website URL</label>
                <input type="url" name="website" value={socials.website} onChange={handleSocialsChange} className="w-full px-3 py-2 mt-1 bg-white dark:bg-slate-700 rounded-md"/>
              </div>
            </div>
          </div>
          <div className="border-t dark:border-slate-700 pt-6">
              <h2 className="text-xl font-semibold mb-4">Your Interests</h2>
              <div className="space-y-6">
                <SkillTagInput title="Skills you want to teach" skills={skillsToTeach} setSkills={setSkillsToTeach} />
                <SkillTagInput title="Skills you want to learn" skills={skillsToLearn} setSkills={setSkillsToLearn} />
              </div>
            </div>
        </form>
         <div className="fixed bottom-0 left-0 w-full p-4 bg-white dark:bg-slate-800 border-t dark:border-slate-700 md:relative md:bg-transparent md:border-none md:p-0 md:mt-8">
          <div className="container mx-auto max-w-2xl">
            <button 
              type="submit" 
              form="profile-form" 
              disabled={loading} 
              onClick={handleSubmit}
              className="w-full px-4 py-3 font-bold text-white bg-accent-600 rounded-md hover:bg-accent-700 disabled:bg-accent-400"
            >
              {loading ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </div>
        <div className="mt-8 border-t dark:border-slate-700 pt-6">
          <h2 className="text-xl font-semibold mb-4">Account Management</h2>
          <button
            type="button"
            onClick={handleChangePasswordClick}
            className="w-full px-4 py-2 font-bold text-white bg-slate-600 rounded-md hover:bg-slate-700"
          >
            Change Password
          </button>
        </div>
      </div>
    </div>
     <UpdateEmailModal 
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
    />
    </>
  );
};

export default EditProfilePage;
