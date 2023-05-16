import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import ACTIONS from '../Actions';
import Client from '../components/Client';
import Editor from '../components/Editor';
import { initSocket } from '../socket';
import {
    useLocation,
    useNavigate,
    Navigate,
    useParams,
} from 'react-router-dom';

const EditorPage = () => {
    const socketRef = useRef(null);
    const codeRef = useRef(null);
    const location = useLocation();
    const { roomId } = useParams();
    const reactNavigator = useNavigate();
    const [clients, setClients] = useState([]);
    const [output, setOutput] = useState('');

    useEffect(() => {
        const init = async () => {
            socketRef.current = await initSocket();
            socketRef.current.on('connect_error', (err) => handleErrors(err));
            socketRef.current.on('connect_failed', (err) => handleErrors(err));

            function handleErrors(e) {
                console.log('socket error', e);
                toast.error('Socket connection failed, try again later.');
                reactNavigator('/');
            }

            socketRef.current.emit(ACTIONS.JOIN, {
                roomId,
                username: location.state?.username,
            });

            // Listening for joined event
            socketRef.current.on(
                ACTIONS.JOINED,
                ({ clients, username, socketId }) => {
                    if (username !== location.state?.username) {
                        toast.success(`${username} joined the room.`);
                        console.log(`${username} joined`);
                    }
                    setClients(clients);
                    socketRef.current.emit(ACTIONS.SYNC_CODE, {
                        code: codeRef.current,
                        socketId,
                    });
                }
            );

            // Listening for disconnected
            socketRef.current.on(
                ACTIONS.DISCONNECTED,
                ({ socketId, username }) => {
                    toast.success(`${username} left the room.`);
                    setClients((prev) => {
                        return prev.filter(
                            (client) => client.socketId !== socketId
                        );
                    });
                }
            );
        };
        init();
        return () => {
            socketRef.current.disconnect();
            socketRef.current.off(ACTIONS.JOINED);
            socketRef.current.off(ACTIONS.DISCONNECTED);
        };
    }, []);

    async function copyRoomId() {
        try {
            await navigator.clipboard.writeText(roomId);
            toast.success('Room ID has been copied to your clipboard');
        } catch (err) {
            toast.error('Could not copy the Room ID');
            console.error(err);
        }
    }

    // function executeCode(jstring) {
    //     const axios = require("axios");

    //     const encodedParams = new URLSearchParams();
    //     encodedParams.append(jstring)

    //     const options = {
    //         method: 'POST',
    //         url: 'https://codex7.p.rapidapi.com/',
    //         headers: {
    //           'content-type': 'application/x-www-form-urlencoded',
    //           'X-RapidAPI-Key': '9af68ac7a2mshaf4184ba5c4f2dfp124492jsn39bb767f43a1',
    //           'X-RapidAPI-Host': 'codex7.p.rapidapi.com'
    //         },
    //         encodedParams
    //     };

    //     axios.request(options).then(function (response) {
    //         console.log(response.data);
    //     }).catch(function (error) {
    //         console.error(error);
    //     });
    // }


    function leaveRoom() {
        reactNavigator('/');
    }
    async function handleRunButtonClick() {
        const language = document.getElementById("language").value;
        const input = document.getElementById("input").value;
        const code = codeRef.current;

        // const payload = {
        //     code,
        //     language,
        //     input,
        // };
        // const jsonString = JSON.stringify(payload);

        // console.log('JSON Payload:', jsonString);

        const fetch = require('node-fetch');
        // const axios = require("axios");
        const encodedParams = new URLSearchParams();
        encodedParams.append('code', code);
        encodedParams.append('language', language);
        encodedParams.append('input', input);
        const url = 'https://api.codex.jaagrav.in'; //'https://codex7.p.rapidapi.com/';
        const options = {
            method: 'POST',
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                // 'X-RapidAPI-Key': '9af68ac7a2mshaf4184ba5c4f2dfp124492jsn39bb767f43a1',
                // 'X-RapidAPI-Host': 'codex7.p.rapidapi.com'
            },
            body: encodedParams
        };

        try {
            const response = await fetch(url, options);
            const result = await response.text();
            console.log(result);
             const output = JSON.parse(result);
            var finalOut;
            if (output.error !== ""){
                
                finalOut = output.error + output.output;
            }
            else{
                finalOut = output.output;
            }
            console.log(finalOut);
            setOutput(finalOut);
        } catch (error) {
            console.error(error);
        }
        // const options = {
        //     method: 'POST',
        //     url: 'https://codex7.p.rapidapi.com/',
        //     headers: {
        //         'content-type': 'application/x-www-form-urlencoded',
        //         'X-RapidAPI-Key': '9af68ac7a2mshaf4184ba5c4f2dfp124492jsn39bb767f43a1',
        //         'X-RapidAPI-Host': 'codex7.p.rapidapi.com'
        //     },
        //     encodedParams
        // };
        // axios.request(options).then(function (response) {
        //     console.log(response.data);
        // }).catch(function (error) {
        //     console.error(error);
        // });
    }
    if (!location.state) {
        return <Navigate to="/" />;
    }

    return (
        <div className="mainWrap">
            <div className="aside">
                <div className="asideInner">
                    <div className="logo">
                        <img
                            className="logoImage"
                            src="/code-sync.png"
                            alt="logo"
                        />
                    </div>
                    <h3>Connected</h3>
                    <div className="clientsList">
                        {clients.map((client) => (
                            <Client
                                key={client.socketId}
                                username={client.username}
                            />
                        ))}
                    </div>
                </div>
                <button className="btn copyBtn" onClick={copyRoomId}>
                    Copy ROOM ID
                </button>
                <button className="btn leaveBtn" onClick={leaveRoom}>
                    Leave
                </button>
            </div>
            <div className="editorWrap">
                <Editor
                    socketRef={socketRef}
                    roomId={roomId}
                    onCodeChange={(code) => {
                        codeRef.current = code;
                    }}
                    onBeforeChange={(editor, data, value) => {
                        editor.setValue(value);
                    }}
                />
            </div>
            <div className="outputWrap">

                <div className="languageSelect">
                    <label htmlFor="language">Choose Language:</label>
                    <select name="language" id="language">
                        <option value="js" defaultValue>JavaScript</option>
                        <option value="py">Python</option>
                        <option value="cpp">C++</option>
                    </select>
                </div>

                <button className="btn runBtn" onClick={handleRunButtonClick}>Run</button>

                <div className="inputBox1">
                    <label htmlFor="input" className="inPut1" id="inputL">Input:</label>
                    <textarea name="input" id="input" className="inPut"></textarea>

                    <label htmlFor="output" className="outPut1">Output:</label>
                    <textarea value={output} readOnly name="output" id="output" className="outPut"></textarea>
                </div>
            </div>
        </div>
    );

};

export default EditorPage;
