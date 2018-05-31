function start() {
  const waiting = $('<div>').addClass('waiting');
  const words = $('<p>').addClass('waitingLetter').text('Waiting For Opponent');
  const waitingAni = $('<div>').addClass('waiting_ani_container');
  const list = $('<ul>').append('<li>').append('<li>').append('<li>').append('<li>').append('<li>');
  waitingAni.append(list);
  waiting.append(words).append(waitingAni);

  const ready_room = $('<div>').addClass('ready_room hidden');
  const opponent_container = $('<div>').addClass('opponent_container');
  const opponent_ready = $('<div>').addClass('opponent_ready');
  const ready_container = $('<div>').addClass('ready_container');
  const ready = $('<div>').addClass('ready').text('Ready');
  ready_room.append(opponent_ready).append(ready);

  const main = $('<div>').addClass('main hidden');
  const label = $('<div>').addClass('label_both')
  const label_myside = $('<p>').addClass('label_myside').text('Home');
  const label_opponent = $('<p>').addClass('label_opponent').text('Opponent');
  label.append(label_myside).append(label_opponent);

  const point = $('<div>').addClass('point');
  const my_point = $('<p>').addClass('my_point').text('0');
  const opponent_point = $('<p>').addClass('opponent_point').text('0');
  point.append(my_point).append(opponent_point);

  const opponent = $('<div>').addClass('opponent');
  const spade = $('<div>').addClass('spade');
  const choice = $('<div>').addClass('choice');
  const mine = $('<div>').addClass('mine');
  for(let i = 1; i <= 13; i++){
    const card = $('<div>').attr('data-card', i);
    const img = $(`<img src='img/heart_${i}.png'>`);
    card.append(img);
    mine.append(card);
  }
  main.append(label).append(point).append(opponent).append(spade).append(choice).append(mine);

  const end = $('<div>').addClass('end hidden');
  const result = $('<div>').addClass('result');
  const restart = $('<div>').addClass('restart').text('Restart');
  end.append(result).append(restart);

  $('.game_container').append(waiting).append(ready_room).append(main).append(end);
}

$(document).ready(function() {
  const socket = io();
  let spade;
  let currentSpade;
  let checkCard = {mine: 0, opponent: 0};
  let checkReady = [];
  let myPoint = 0;
  let opponentPoint = 0;

  socket.emit('join', 1);

  start();

  function clear() {
    checkCard.mine = 0;
    checkCard.opponent = 0;
    checkReady = [];
    myPoint = 0;
    opponentPoint = 0;
    $('.game_container').empty();
    $('.chat_log').empty();
  }

  function result() {
    if(myPoint > opponentPoint){
      $('.result').text("Winner!!");
    } else if(myPoint < opponentPoint) {
      $('.result').text("Lose....");
    } else {
      $('.result').text('Draw!');
    }
  }

  function points() {
    if(checkCard.mine > checkCard.opponent) {
      myPoint += currentSpade;
      $('.my_point').text(myPoint);
    } else if(checkCard.mine < checkCard.opponent) {
      opponentPoint +=  currentSpade;
      $('.opponent_point').text(opponentPoint);
    }
  }
  function setSpade() {
    if(spade.length !== 0) {
      $('.spade img').remove()
      $('.spade').append(`<img src="img/spade_${spade[0]}.png"/>`);
      currentSpade = spade.shift();
      onClicked();
    } else {
      $('.main').addClass('hidden');
      $('.end').removeClass('hidden');
      $('.finish').text('finish');
      result();
    }
  }

  function onClicked() {
    $('.mine div').on('click', function(){
      const card = $(this).attr('data-card');
      socket.emit('choice_mine', card);
      $('.choice img').remove()
      $('.mine div').off('click');
      $('.choice').append(`<img src="img/cover.png"/>`);
      checkCard.mine = Number(card);
      $(this).remove();
      setTime()
    })
  }

  function checkForNextRound() {
    if(checkCard.mine && checkCard.opponent) {
      points();
      checkCard.mine = 0;
      checkCard.opponent = 0;
      $('.choice img').remove();
      $('.opponent img').remove();
      setSpade();
    }
  }

  function checkIfReady(){
    if(checkReady.length === 2){
      $('.ready_room').addClass('hidden');
      $('.main').removeClass('hidden');
      setSpade();
    }
  }

  function setTime() {
    if(checkCard.mine && checkCard.opponent){
      setTimeout(function(){
        $('.opponent').empty();
        $('.choice').empty();
        $('.opponent').append(`<img src="img/diamond_${checkCard.opponent}.png"/>`);
        $('.choice').append(`<img src="img/heart_${checkCard.mine}.png"/>`);
        setTimeout(function(){
          checkForNextRound();
        }, 1000)
      }, 1000);
    }
  }

  $('.game_container').on('click', '.restart', function() {
    clear();
    start();
    socket.emit('join', 1);
  })

  socket.on('spade', function(begin_spade){
    spade = begin_spade;
  })

  socket.on('room_ready', function(){
    $('.waiting').addClass('hidden');
    $('.ready_room').removeClass('hidden');
  })

  socket.on('get_opponent', function(card){
    $('.opponent').append(`<img src="img/cover.png"/>`);
    checkCard.opponent = Number(card);
    setTime();
  })

  $('.game_container').on('click', '.ready', function() {
    checkReady.push(1);
    socket.emit('ready', 1);
    checkIfReady();
    $('.ready').off('click');
  })

  socket.on('opponent_ready', function(ready){
    $('.opponent_ready').text('opponent ready');
    checkReady.push(ready);
    checkIfReady();
  })

  $('.chat_form').on('submit', function(e){
    e.preventDefault();
    socket.emit('send message', $('.message').val());
    $('.message').val("");
    $(".message").focus();
  });

  socket.on('message', function(msg){
    $('.chat_log').append("<p class=\"otherMessage\">"+msg+"</p>");
    $('.chat_log').scrollTop($('.chat_log')[0].scrollHeight);
  });

  socket.on('myMessage', function(msg){
    $('.chat_log').append("<p class=\"myMessage\">"+msg+"</p>");
    $('.chat_log').scrollTop($('.chat_log')[0].scrollHeight);
  });

  socket.on('disconnect', function(name){
    $('.chat_log').append("<p class=\"disconnect\">"+name+" disconnected"+"</p>");
  });

  socket.on('Userconnect', function(name){
    $('.chat_log').append("<p class=\"connect\">"+name+" connected"+"</p>");
  });
})

