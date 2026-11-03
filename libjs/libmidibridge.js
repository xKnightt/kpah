const dummyMidiPlayer = {
    duration: 0,
    volume: 0,
    async setSequence() { return 0; },
    play() {},
    loop() {},
    stop() {},
    shortEvent() {},
    async getPosition() { return 0; },
    seek() {}
};

export default {
    Java_pl_zb3_freej2me_bridge_media_MidiBridge_getMidiPlayer(lib) {
        return (window.libmidi && window.libmidi.midiPlayer) ? window.libmidi.midiPlayer : dummyMidiPlayer;
    },
    async Java_pl_zb3_freej2me_bridge_media_MidiBridge_midiSetSequence(lib, player, sequence) {
        if (!window.soundEnabled || player === dummyMidiPlayer) return 0;
        if (sequence) {
            await player.setSequence(sequence.buffer);
            return player.duration;
        }
        return -1;
    },
    Java_pl_zb3_freej2me_bridge_media_MidiBridge_midiPlay(lib, player) {
        if (!window.soundEnabled || !player) return;
        player.play();
    },
    Java_pl_zb3_freej2me_bridge_media_MidiBridge_midiLoop(lib, player, times) {
        if (!window.soundEnabled || !player) return;
        player.loop(times);
    },
    Java_pl_zb3_freej2me_bridge_media_MidiBridge_midiStop(lib, player) {
        if (!player) return;
        player.stop();
    },
    Java_pl_zb3_freej2me_bridge_media_MidiBridge_midiShortEvent(lib, player, status, data1, data2) {
        if (!window.soundEnabled || !player) return;
        player.shortEvent(status, data1, data2);
    },
    async Java_pl_zb3_freej2me_bridge_media_MidiBridge_midiGetPosition(lib, player) {
        if (!window.soundEnabled || !player) return 0;
        return await player.getPosition();
    },
    Java_pl_zb3_freej2me_bridge_media_MidiBridge_midiSeek(lib, player, pos) {
        if (!window.soundEnabled || !player) return;
        player.seek(pos);
    },
    Java_pl_zb3_freej2me_bridge_media_MidiBridge_midiGetVolume(lib, player) {
        return player ? player.volume : 0;
    },
    Java_pl_zb3_freej2me_bridge_media_MidiBridge_midiSetVolume(lib, player, vol) {
        if (player) player.volume = vol;
    },
}
