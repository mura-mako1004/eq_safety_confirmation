# eq_safety_confirmation  
関東地方で地震が起きた時にSlack→Googleフォームで安否確認をする  
  
# DEMO  
![image](https://user-images.githubusercontent.com/98931080/173096407-4fc8484a-2884-49bd-b3a3-37d7f15cb520.png)  
（テストの為震度1）  
  
# Requirement  
[Slack API](https://api.slack.com/)  
[SlackApp](https://github.com/soundTricker/SlackApp)  
スクリプトID：1on93YOYfSmV92R5q59NpKmsyWIQD8qnoLYk-gkQBI92C58SPyA2x1-bq  
  
# Usage  
GASトリガー：sendEQAlertを10分間隔で  
  
# variable  
### postSlackbot  
SlackAPIで登録したボットのトークン： `const TOKEN = "xoxb-";`  
Slackボットがメッセージを投稿するチャンネルを定義する： `let channelId = "";`  
### createFormteForm  
スプレッドシートのID： `let ssId = "";`  
### sendEQAlert  
通知下限震度： `let eqInt = 5;`  
