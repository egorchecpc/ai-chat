import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';

const AIChatApp = () => {
    const [messages, setMessages] = useState([
        {
            id: 1,
            text: "Привет! Я ваш AI помощник для поиска товаров на Onliner. Задайте мне вопрос о продукте, который вас интересует!",
            sender: 'ai',
            timestamp: new Date()
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [apiStatus, setApiStatus] = useState('checking'); // checking, online, offline
    const messagesEndRef = useRef(null);

    const API_BASE_URL = 'http://localhost:5000';

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Проверка статуса API при загрузке
    useEffect(() => {
        checkApiHealth();
    }, []);

    const checkApiHealth = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/health`);
            if (response.ok) {
                setApiStatus('online');
            } else {
                setApiStatus('offline');
            }
        } catch (error) {
            console.error('API недоступен:', error);
            setApiStatus('offline');
        }
    };

    // Функция для парсинга текста и создания кликабельных ссылок
    const parseTextWithLinks = (text) => {
        // Регулярное выражение для поиска URL
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = text.split(urlRegex);

        return parts.map((part, index) => {
            if (urlRegex.test(part)) {
                return (
                    <a
                        key={index}
                        href={part}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 underline break-all"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <span className="break-all">{part}</span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                );
            }
            return part;
        });
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputText.trim() || isLoading) return;

        const userMessage = {
            id: Date.now(),
            text: inputText,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        const currentInput = inputText;
        setInputText('');
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: currentInput }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            const aiMessage = {
                id: Date.now() + 1,
                text: data.response,
                sender: 'ai',
                timestamp: new Date(),
                metadata: {
                    productsFound: data.products_found,
                    classificationResult: data.classification_result
                }
            };

            setMessages(prev => [...prev, aiMessage]);

        } catch (error) {
            console.error('Ошибка при отправке сообщения:', error);

            const errorMessage = {
                id: Date.now() + 1,
                text: `Извините, произошла ошибка: ${error.message}. Пожалуйста, попробуйте еще раз или проверьте подключение к серверу.`,
                sender: 'ai',
                timestamp: new Date(),
                isError: true
            };

            setMessages(prev => [...prev, errorMessage]);
            setApiStatus('offline');
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusIcon = () => {
        switch (apiStatus) {
            case 'online':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'offline':
                return <AlertCircle className="w-4 h-4 text-red-500" />;
            default:
                return <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />;
        }
    };

    const getStatusText = () => {
        switch (apiStatus) {
            case 'online':
                return 'Подключено';
            case 'offline':
                return 'Не подключено';
            default:
                return 'Проверка...';
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm w-full">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <Bot className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold text-slate-800">Onliner Helper</h1>
                            <p className="text-sm text-slate-500">AI помощник для поиска товаров</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {getStatusIcon()}
                        <span className={`text-sm ${
                            apiStatus === 'online' ? 'text-green-600' :
                                apiStatus === 'offline' ? 'text-red-600' : 'text-yellow-600'
                        }`}>
                            {getStatusText()}
                        </span>
                        {apiStatus === 'offline' && (
                            <button
                                onClick={checkApiHealth}
                                className="ml-2 px-2 py-1 text-xs bg-gradient-to-r from-blue-500 to-blue-600 text-white  rounded hover:bg-blue-600/0.5"
                            >
                                Переподключить
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
                <div className="w-full mx-auto space-y-6">
                    {messages.map((message) => (
                        <div key={message.id}>
                            <div
                                className={`flex gap-3 ${
                                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                                }`}
                            >
                                {message.sender === 'ai' && (
                                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                        <Bot className="w-4 h-4 text-white" />
                                    </div>
                                )}

                                <div
                                    className={`max-w-2xl px-4 py-3 rounded-2xl break-words overflow-hidden ${
                                        message.sender === 'user'
                                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                                            : message.isError
                                                ? 'bg-red-50 text-red-800 border border-red-200'
                                                : 'bg-white text-slate-800 shadow-md border border-slate-200'
                                    }`}
                                >
                                    <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                        {message.sender === 'ai' && !message.isError
                                            ? parseTextWithLinks(message.text)
                                            : message.text
                                        }
                                    </div>
                                    <div className="flex items-center justify-between mt-2 gap-2">
                                        <p
                                            className={`text-xs flex-shrink-0 ${
                                                message.sender === 'user'
                                                    ? 'text-blue-100'
                                                    : message.isError
                                                        ? 'text-red-500'
                                                        : 'text-slate-500'
                                            }`}
                                        >
                                            {formatTime(message.timestamp)}
                                        </p>
                                        {message.metadata?.productsFound !== undefined && (
                                            <p className="text-xs text-slate-500 flex-shrink-0">
                                                Найдено товаров: {message.metadata.productsFound}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {message.sender === 'user' && (
                                    <div className="w-8 h-8 bg-gradient-to-r from-slate-400 to-slate-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                        <User className="w-4 h-4 text-white" />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex gap-3 justify-start">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                            <div className="bg-white text-slate-800 shadow-md border border-slate-200 px-4 py-3 rounded-2xl">
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                    <span className="text-sm text-slate-600">AI анализирует запрос...</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input */}
            <div className="bg-white border-t border-slate-200 px-4 py-4">
                <div className="w-full mx-auto">
                    {apiStatus === 'offline' && (
                        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-700">
                                Сервер недоступен. Убедитесь, что Flask API запущен на порту 5000.
                            </p>
                        </div>
                    )}
                    <div className="flex gap-3">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(e)}
                                placeholder={apiStatus === 'offline' ? 'Сервер недоступен...' : 'Например: "Покажи смартфоны до 500 рублей"'}
                                className="w-full px-4 py-3 pr-12 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:text-gray-500"
                                disabled={isLoading || apiStatus === 'offline'}
                            />
                        </div>
                        <button
                            onClick={handleSendMessage}
                            type="submit"
                            disabled={!inputText.trim() || isLoading || apiStatus === 'offline'}
                            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                            <span className="hidden sm:inline">
                                {isLoading ? 'Отправка...' : 'Отправить'}
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIChatApp;