//slackでメッセージを送信
function postSlackbot(message) {
  //SlackAPIで登録したボットのトークンを設定する
  const TOKEN = "xoxb-*******************************************";
  //Slackボットがメッセージを投稿するチャンネルを定義する
  let channelId = "#general";

  //ライブラリから導入したSlackAppを定義し、トークンを設定する
  let slackApp = SlackApp.create(TOKEN);
  //SlackAppオブジェクトのpostMessageメソッドでボット投稿を行う
  slackApp.postMessage(channelId, message);
}


// googleformを作成する
function createForm(){
  // スプレッドシートのID
  let ssId = '******************************************'

  // formを作成する
  const NEW_FORM = FormApp.create('安否確認フォーム');
  // 説明
  NEW_FORM.setDescription('災害時の安否確認');
  // 質問①
  with(NEW_FORM.addTextItem()){
    setTitle('事業所名／氏名を教えてください');
    setHelpText('事業所名／氏名　の形式で回答してください');
    // 必須
    setRequired(true);
  }
  // 質問②
  with(NEW_FORM.addMultipleChoiceItem()){
    setTitle('現在地を教えてください');
    setChoiceValues(['自宅', '会社', '通勤途中']);
    // その他
    showOtherOption(true);
    // 必須
    setRequired(true);
  }
  // 質問③
  with(NEW_FORM.addMultipleChoiceItem()){
    setTitle('あなたの状況を教えてください');
    setChoiceValues(['無事', '怪我']);
    // その他
    showOtherOption(true);
    // 必須
    setRequired(true);
  }
  // 質問④
  with(NEW_FORM.addMultipleChoiceItem()){
    setTitle('家族の状況を教えてください');
    setChoiceValues(['無事', '怪我', '分からない']);
    // その他
    showOtherOption(true);
    // 必須
    setRequired(true);
  }
  // 質問⑤
  with(NEW_FORM.addMultipleChoiceItem()){
    setTitle('家の状態を教えてください');
    setChoiceValues(['無事', '半壊', '全壊']);
    // その他
    showOtherOption(true);
    // 必須
    setRequired(true);
  }
  //質問⑥
  with(NEW_FORM.addMultipleChoiceItem()){
    setTitle('出社の可否');
    setChoiceValues(['出社可能', '出社不可']);
    // その他
    showOtherOption(true);
    // 必須
    setRequired(true);
  }
  //質問⑦
  with(NEW_FORM.addParagraphTextItem()){
    setTitle('コメント');
    setHelpText('コメントがあれば記入してください');
  }
  // 回答の再編集を許可
  NEW_FORM.setAllowResponseEdits(true);
  // ログイン必須
  NEW_FORM.setRequireLogin(true);
  // メールアドレス収集
  NEW_FORM.setCollectEmail(true);
  // お礼メッセージ
  NEW_FORM.setConfirmationMessage('ご回答ありがとうございました');
  // 収集先の指定
  NEW_FORM.setDestination(FormApp.DestinationType.SPREADSHEET, ssId);
  // URLの取得
  let formUrl = NEW_FORM.shortenFormUrl(NEW_FORM.getPublishedUrl());
  return formUrl;
}


// 災害情報を取得してSlackで送る
function sendEQAlert() {
  // 通知下限震度  
  let eqInt = 5;

  // 気象庁防災情報XMLフォーマットを全て取得
  const EQVOL_XML_URL = 'http://www.data.jma.go.jp/developer/xml/feed/eqvol.xml';
  let eqvolConText = UrlFetchApp.fetch(EQVOL_XML_URL).getContentText();
  // XMLをparseする
  let eqvolDocment = XmlService.parse(eqvolConText);
  let eqvolElement = eqvolDocment.getRootElement();
  // entryノードを全てentryArray配列にpushする
  let eqvolArray = eqvolElement.getDescendants();
  let entryArray = [];
  for(var i in eqvolArray) {
    let entryElement = eqvolArray[i].asElement();
    if(entryElement != null && entryElement.getName() == 'entry') {
      entryArray.push(entryElement);
    }
  }
  //名前空間
  const W3ORG05_URI = 'http://www.w3.org/2005/Atom';
  let w3org05Ns = XmlService.getNamespace(W3ORG05_URI);
  const SEISMOL_URI = 'http://xml.kishou.go.jp/jmaxml1/body/seismology1/';
  let seismolNs = XmlService.getNamespace(SEISMOL_URI);
  const ELEMENT_URI = 'http://xml.kishou.go.jp/jmaxml1/elementBasis1/';
  let elementNs = XmlService.getNamespace(ELEMENT_URI);
  const INFORMA_URI = 'http://xml.kishou.go.jp/jmaxml1/informationBasis1/';
  let informaNs = XmlService.getNamespace(INFORMA_URI); 
  // 11分をミリ秒で
  const DIFFMIN = 660000; 
  const EARTHQU = '震源・震度に関する情報';
  // トリガー発動時刻取得(ミリ秒)
  let triggerDate = new Date().getTime();
  // entry の一つ一つの要素を true になるまで見る
  entryArray.some(function(fdElement, j) { 
    // title と updated を取得
    let titleStr = fdElement.getChild('title', w3org05Ns).getText();
    let updatedDate = (new Date(fdElement.getChild('updated',w3org05Ns).getText())).getTime();
    // タイトルが「震源・震度に関する情報」 かつ 11分前から現在に更新されたものを取得する
    if(EARTHQU == titleStr){
      if(triggerDate - DIFFMIN <= updatedDate){
        urlidStr = fdElement.getChild('id', w3org05Ns).getText(); 
        let vxse53ConText = UrlFetchApp.fetch(urlidStr).getContentText();
        let vxse53Document = XmlService.parse(vxse53ConText);
        let vxse53Element = vxse53Document.getRootElement();
        // 都道府県名を取得
        let areaArray = vxse53Element.getChild('Body',seismolNs).getChild('Intensity',seismolNs).getChild('Observation',seismolNs).getChildren('Pref',seismolNs);
        let areaValues = [];
        let eqMaxJudge = false;
        for(var j in areaArray){
          let areaStr = areaArray[j].getChild('Name',seismolNs).getText();
          // 最大震度を取得
          let eqMaxInt = areaArray[j].getChild('MaxInt',seismolNs).getText();
          if(areaStr == "茨城県" || areaStr == "栃木県" || areaStr == "群馬県" || areaStr == "埼玉県" || areaStr == "千葉県" || areaStr == "東京都" || areaStr == "神奈川県"){
            areaValues.push([areaStr,eqMaxInt]);
            // 震度が通知下限震度以上の場合
            if(eqMaxInt.slice(0,1) >= eqInt){
              eqMaxJudge = true;
            }
          }          
        }
        // 関東地方で、震度が通知下限震度以上なら情報取得
        if(eqMaxJudge){
          // マグニチュード取得
          let magnitStr = vxse53Element.getChild('Body',seismolNs).getChild('Earthquake',seismolNs).getChild('Magnitude',elementNs).getText();
          // 標題取得
          let eqinfoStr = vxse53Element.getChild('Head',informaNs).getChild('Headline',informaNs).getChild('Text',informaNs).getText(); 
          // 震源地取得
          let hypoceStr = vxse53Element.getChild('Body',seismolNs).getChild('Earthquake',seismolNs).getChild('Hypocenter',seismolNs).getChild('Area',seismolNs).getChild('Name',seismolNs).getText(); 
          // 津波情報
          let tunamiStr = vxse53Element.getChild('Body',seismolNs).getChild('Comments',seismolNs).getChild('ForecastComment',seismolNs).getChild('Text',seismolNs).getText(); 
          // 都道府県ごとの最大震度
          let areaEqStr = "";
          for(var k in areaValues){
            areaEqStr += areaValues[k][0] +　", 最大震度: " + areaValues[k][1] + "\r\n"
          }
          let safetyForm = createForm();
          
          // メッセージ作成
          let sendmsgStr = "※安否確認　" +　"【" + eqinfoStr + "】※\r\n" + 
                      "マグニチュード " + magnitStr + " の強い地震が発生しました\r\n" +
                      "震源地: " + hypoceStr + "\r\n\r\n" +
                      areaEqStr + "\r\n" +
                      tunamiStr + "\r\n\r\n" +
                      safetyForm + "\r\n" +
                      "上記URLから、現在の状況について入力してください\r\n\r\n";
          //slackにメッセージを送付
          postSlackbot(sendmsgStr);
        }
      }else{
        // true を返すことで some から抜ける
        return true;
      }
    } 
  });
}
