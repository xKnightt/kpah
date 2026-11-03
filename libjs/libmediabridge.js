// this needs to be run on the main thread
// assuming window.libmedia has the instance and contexte
export default {
    Java_pl_zb3_freej2me_bridge_media_MediaBridge_createMediaPlayer(lib) {
        const player = window.libmedia.createMediaPlayer();
        player.addEventListener('end-of-media', e => {
            window.evtQueue.queueEvent({kind: 'player-eom', player: e.target});
        })
        return player;
    },
    async Java_pl_zb3_freej2me_bridge_media_MediaBridge_playerLoad(lib, player, data, contentType) {
        if (!window.soundEnabled) return true;
        const res = await player.load(data.buffer, contentType);
        return res;
    },
    Java_pl_zb3_freej2me_bridge_media_MediaBridge_playerPlay(lib, player) {
        if (!window.soundEnabled) return;
        player.play();
    },
    Java_pl_zb3_freej2me_bridge_media_MediaBridge_playerSetLooping(lib, player, loop) {
        player.setLooping(loop);
    },
    Java_pl_zb3_freej2me_bridge_media_MediaBridge_playerStop(lib, player) {
        player.stop();
    },
    Java_pl_zb3_freej2me_bridge_media_MediaBridge_playerGetPosition(lib, player) {
        const pos = player.position;
        return pos;
    },
    Java_pl_zb3_freej2me_bridge_media_MediaBridge_playerGetDuration(lib, player) {
        const pos = player.duration || -1;
        return pos;
    },
    Java_pl_zb3_freej2me_bridge_media_MediaBridge_playerSeek(lib, player, pos) {
        player.seek(pos);
    },
    Java_pl_zb3_freej2me_bridge_media_MediaBridge_playerClose(lib, player) {
        player.close();
    },
    Java_pl_zb3_freej2me_bridge_media_MediaBridge_playerGetVolume(lib, player) {
        return player.volume;
    },
    Java_pl_zb3_freej2me_bridge_media_MediaBridge_playerSetVolume(lib, player, vol) {
        player.volume = vol;
    },
    Java_pl_zb3_freej2me_bridge_media_MediaBridge_playerSetupVideo(lib, player, ctxObj, javaPlayerObj, x, y, w, h, fullscreen) {
        player.configureVideo(ctxObj, () => {
            window.evtQueue.queueEvent(
                {kind: 'player-video-frame', player: javaPlayerObj},
                evt => evt.kind === 'player-video-frame' && evt.player === javaPlayerObj
            );
        }, x, y, w, h, fullscreen)
    },
    Java_pl_zb3_freej2me_bridge_media_MediaBridge_playerGetWidth(lib, player) {
        return player.videoWidth;
    },
    Java_pl_zb3_freej2me_bridge_media_MediaBridge_playerGetHeight(lib, player) {
        return player.videoHeight;
    },
    async Java_pl_zb3_freej2me_bridge_media_MediaBridge_playerGetSnapshot(lib, player, type) {
        const buffer = await player.getSnapshot(type);
        return buffer ? new Int8Array(buffer) : null;
    },
}
