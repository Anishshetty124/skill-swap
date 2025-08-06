import { createContext, useState, useEffect, useContext } from "react";
import { useAuth } from "./AuthContext";
import io from "socket.io-client";

const SocketContext = createContext();

export const useSocketContext = () => {
	return useContext(SocketContext);
};

export const SocketContextProvider = ({ children }) => {
	const [socket, setSocket] = useState(null);
	const [onlineUsers, setOnlineUsers] = useState([]);
	const { user } = useAuth();

	useEffect(() => {
		if (user?._id) {
			const newSocket = io(import.meta.env.VITE_API_BASE_URL.replace("/api/v1", ""), {
				query: {
					userId: user._id,
				},
			});

			setSocket(newSocket);

			newSocket.on("getOnlineUsers", (users) => {
				setOnlineUsers(users);
			});

			return () => newSocket.close();
		} else {
			if (socket) {
				socket.close();
				setSocket(null);
			}
		}
	}, [user?._id]);

	return <SocketContext.Provider value={{ socket, onlineUsers }}>{children}</SocketContext.Provider>;
};
