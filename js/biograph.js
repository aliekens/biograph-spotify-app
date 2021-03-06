var sp = getSpotifyApi(1);
var models = sp.require('sp://import/scripts/api/models');
var views = sp.require("sp://import/scripts/api/views");

var sourceartist = "";
var previoustargetartist = "";

models.player.observe(models.EVENT.CHANGE, function(event) {
	var playerTrackInfo = sp.trackPlayer.getNowPlayingTrack();
	var artist = playerTrackInfo.track.artists[0].name;
	if( previoustargetartist != artist ) {
		$('#graph').html('<img src="jackhammerf5.gif"/>');
		$.ajax( 'http://music.biograph.be/miner/graph_spotify?source_id=' + sourceartist + '&target_id=' + artist );
	}
	previoustargetartist = artist;
});

// create a temporary playlist
var tempPlaylist = new models.Playlist();
jQuery.ajaxSettings.traditional = true;  

function clearPlaylist( playlist ) {
	while( playlist.data.length > 0 ) {
		playlist.data.remove( 0 );
	}
}

function makePlaylistFromNowPlaying() {
	var playerTrackInfo = sp.trackPlayer.getNowPlayingTrack();
	clearPlaylist( tempPlaylist );
	$('#player').html('<img src="jackhammerf5.gif"/>');
	if (playerTrackInfo == null) {
		info("Start playing something and I'll make a playlist of good songs based on that song");
	} else {
		info("");
		var track = playerTrackInfo.track;
		var artist = track.artists[0].name;
		sourceartist = artist;
		fetchPlaylist( artist, 25 );
		var playlistView = new views.List( tempPlaylist );
		$('#player').html( playlistView.node );
		$('#player-info').html( "Playlist based on " + artist );
	}

}

function rand(max) {
	return Math.floor( Math.random() * max );
}

function xinspect(o,i){
    if(typeof i=='undefined')i='';
    if(i.length>50)return '[MAX ITERATIONS]';
    var r=[];
    for(var p in o){
        var t=typeof o[p];
        r.push(i+'"'+p+'" ('+t+') => '+(t=='object' ? 'object:'+xinspect(o[p],i+'  ') : o[p]+''));
    }
    return r.join(i+'\n');
}

function suggestTrack(artist) {
	var url = 'http://ws.spotify.com/search/1/track.json';
	return $.getJSON(
		url, 
		{ 'q': "artist:" + artist }, 
		function(data) {
			var trackdata;
			var counter = 0;
			do {
				trackdata = data.tracks[ rand( data.tracks.length ) ];
				counter += 1;
			} while( ( trackdata.artists[0].name.toLowerCase() != artist.toLowerCase() ) && ( counter < 10 ) );
			if( trackdata.artists[0].name.toLowerCase() == artist.toLowerCase() ) {
				var track = new models.Track.fromURI( trackdata.href );
				tempPlaylist.add(track);
			}
		}
	);
}

function fetchPlaylist(artist, size) {
	var url = 'http://music.biograph.be/miner/artist_json?callback=?';
	var artists = [];
	$.getJSON(
		url, 
		{ 'name': artist }, 
		function(data) {
			$("#results").empty();
			var artists = []
			
			// extract artists from JSON result
			for (var i in data.artists) {
				var artist = data.artists[i].artist;
				artists.push( artist );
			}
			
			// create playlist from these artists
			if( artists.length > 0 ) {
				for(var i in artists ) {
					track = suggestTrack( artists[ i ] );
				}
			}
		}
	);
}

function info(s) {
	$("#info").text(s);
}

function error(s) {
	info(s);
}

function checkResponse(data) {
	if (data.response) {
		if (data.response.status.code != 0) {
			error("Whoops... Unexpected error from server. " + data.response.status.message);
			log(JSON.stringify(data.response));
		} else {
			return true;
		}
	} else {
		error("Unexpected response from server");
	}
	return false;
}

$(document).ready(function() {
	makePlaylistFromNowPlaying();
});

