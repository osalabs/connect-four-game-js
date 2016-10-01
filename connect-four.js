/*
Connect Four game
2016 Oleg Savchuk
https://github.com/osalabs/connect-four-game-js

 */
var ConnectFour = (function ($) {
    var app = {};
    var COLS = 7, ROWS = 6; //area size
    var GOAL = 4;           //goal number of disks
    var place_size = 40; //px, default piece size
    var place_pad = 5; //place padding
    var $cont; //container
    var player_disks = ['', 'red', 'yellow']; //player1 - red, player2 - yellow

    var current_player = 1; //1 or 2
    var player_won = 0; //who won
    var state = []; //keep internal array of area state, 2dimens array

    //public functions
    app.run = function (container) {
        $cont = $(container);
        init();
    }

    //private functions
    /**
     * initializations, called when game starts/restarts
     * @return {void}
     */
    function init() {
        //auto-adjust container dimensions if container size not set
        if (!$cont.height()){
            var $win = $(window);
            var ps_w = $win.width()*0.8/COLS;
            var ps_h = $win.height()*0.8/ROWS;
            place_size = Math.floor(Math.min(ps_w, ps_h));

            $cont.width( place_size*COLS );
            $cont.height( place_size*ROWS );
        }else{
            var ps_w = $cont.width()/COLS;
            var ps_h = $cont.height()/ROWS;
            place_size = Math.floor(Math.min(ps_w, ps_h));
        }

        draw_area();

        //setup events
        $cont.off()
        .on('click', '.place', place_click)
        .on('game-over', game_over);

        player_won=0;

        //player 1 starts
        set_player(1);
    }

    /**
     * create the area with places for disks and reset the state
     * @return {void}
     */
    function draw_area() {
        $cont.addClass('cf').addClass('player1');
        $cont.html('');
        $cont.append('<div class="player-info"></div>');

        state = [];
        for(var i=0;i<COLS;i++){
            state[i]=[];
            for(var j=0;j<ROWS;j++){
                var $place=$('<div class="place empty"></div>').appendTo($cont).css({
                    left: i*place_size+place_pad,
                    top: j*place_size+place_pad,
                    width: place_size-place_pad*2,
                    height: place_size-place_pad*2
                }).data({
                    col: i,
                    row: j
                });
                state[i][j]=[0, $place];
            }
        }
    }

    /**
     * click handler for the place - throws a disk into column
     * @param  {object} e event
     * @return {void}
     */
    function place_click(e) {
        e.preventDefault();
        var $place = $(this);
        if (!$place.is('.empty')) return; //cant put disk to non-empty place

        var data = $place.data();

        put_disk(data.col, data.row);

        if (check_game_over(data.col, data.row)){
            $cont.trigger('game-over');
        }else{
            //switch player
            set_player();
        }
    }

    /**
     * put disk in a col and closest available row
     * @param  {int} col column to place
     * @param  {int} row row to start search empty from
     * @return {[type]}     [description]
     */
    function put_disk(col, row) {
        //find closet empty position just befor filled one
        var last_empty_row=row;
        while(last_empty_row<ROWS-1 && !state[col][last_empty_row+1][0]){
            last_empty_row++;
        }

        //change state
        state[col][last_empty_row][0]=current_player;
        var $place=state[col][last_empty_row][1];
        $place.removeClass('empty');

        //start falling the disk
        var start_left = col*place_size+place_pad;
        var start_top = 0*place_size+place_pad;
        var $fallen = $('<div class="place"></div>').appendTo($cont).css({
            left: start_left,
            top: start_top,
            width: place_size-place_pad*2,
            height: place_size-place_pad*2,
        })
        .addClass('disk')
        .addClass(player_disks[current_player])
        .animate(
            {top: (last_empty_row*place_size+place_pad)}
            , 300
            , 'swing'
            , function() {
                //once disk fell - put the disk to place
                $place.addClass('disk').addClass(player_disks[current_player]);
        });
    }

    /**
     * check if game is over: player have 4+ disks in line or there are no more moves available
     * @param  {array} last_disk last disk data
     * @return {boolean}         true if game is over
     */
    function check_game_over(last_col, last_row) {
        var result = false;

        //game state changes when new disk added, so we only need to check 4 in a row that includes last disk
        var disks;

        try {
            //check vertical row under last disk
            disks=0;
            for(var j=last_row;j<ROWS;j++){
                if (state[last_col][j][0]!=current_player) break;
                disks++;
            }
            if (disks>=GOAL) throw true;

            //check horiz row for last disk
            disks=0;
            //to the right
            for(var i=last_col;i<COLS;i++){
                if (state[i][last_row][0]!=current_player) break;
                disks++;
            }
            //to the left (excluding last pos)
            for(var i=last_col-1;i>=0;i--){
                if (state[i][last_row][0]!=current_player) break;
                disks++;
            }
            if (disks>=GOAL) throw true;

            //check diagonal to right for last disk
            disks=0;
            //diag up-right
            var k=0;
            while(last_col+k<COLS && last_row-k>=0){
                if (state[last_col+k][last_row-k][0]!=current_player) break;
                disks++;
                k++;
            }
            //diag down-left
            k=1;
            while(last_col-k>=0 && last_row+k<ROWS){
                if (state[last_col-k][last_row+k][0]!=current_player) break;
                disks++;
                k++;
            }
            if (disks>=GOAL) throw true;

            //check diagonal to left for last disk
            disks=0;
            //diag up-left
            k=0;
            while(last_col-k>=0 && last_row-k>=0){
                if (state[last_col-k][last_row-k][0]!=current_player) break;
                disks++;
                k++;
            }
            //diag down-right
            k=1;
            while(last_col+k<COLS && last_row+k<ROWS){
                if (state[last_col+k][last_row+k][0]!=current_player) break;
                disks++;
                k++;
            }
            if (disks>=GOAL) throw true;

            //check if we have empty places
            console.log($cont.find('.place.empty').length);
            if (!$cont.find('.place.empty').length){
                console.log('NO MOVES');
                throw false; //no more moves
            }
        } catch(msg) {
            console.log(msg);
            if (msg===true) {
                result=true;
                player_won=current_player;
            }
            if (msg===false) {
                console.log('here');
                result=true;
                player_won=0;
            }
        }

        return result;
    }

    /**
     * just do the game over procedures - show winner, etc
     * @param  {object} e event
     * @return {void}
     */
    function game_over(e) {
        var msg;
        if (player_won>0){
            msg='Player '+player_won+' is a Winner';
        }else{
            msg='Game Over. No Winner this time.';
        }
        $cont.find('.player-info').addClass('gameover').text(msg);

        $cont.off().on('click', init); //on click restart game
    }

    /**
     * set or switch the player, change player info on screen
     * @param {int} force_player 1,2 (set turn to this player) or undefined (switch occured)
     */
    function set_player(force_player) {
        if (typeof(force_player)=='undefined'){
            //switch player
            current_player = (current_player==1?2:1);
        }else{
            current_player = force_player;
        }

        $cont.removeClass('player1 player2').addClass('player'+current_player);
        $cont.find('.player-info').text('Player '+current_player);
    }

    return app;
}(jQuery));