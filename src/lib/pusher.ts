import Pusher from 'pusher-js';

const pusher = new Pusher('d46fcc709d2e9a073434', {
    cluster: 'eu',
    authEndpoint: '/api/pusher/auth',
});

export default pusher;
