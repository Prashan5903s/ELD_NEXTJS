// import 'bootstrap/dist/css/bootstrap.min.css';

export default function MessageBubble({ message, type }) {
    return (
        <div
            className={`mb-2 p-2 rounded ${type === 'group' ? 'bg-primary text-white' : 'bg-light'
                }`}
        >
            {type === 'group' && <strong>{message.sender}:</strong>}
            <div>{message.text}</div>
            <small className="text-muted">{message.time}</small>
        </div>
    );
}
