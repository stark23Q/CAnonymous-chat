"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Search, X, Clock, Smile, Heart, Coffee, Plane, Lightbulb, Flag, Hash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ──────────────────────────── Emoji Data ──────────────────────────── */

interface EmojiCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  emojis: string[];
}

const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: "smileys",
    name: "Smileys & People",
    icon: <Smile className="h-4 w-4" />,
    emojis: [
      "😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","😉","😊","😇","🥰","😍","🤩",
      "😘","😗","☺️","😚","😙","🥲","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔",
      "🫡","🤐","🤨","😐","😑","😶","🫥","😏","😒","🙄","😬","🤥","😌","😔","😪","🤤",
      "😴","😷","🤒","🤕","🤢","🤮","🥵","🥶","🥴","😵","🤯","🤠","🥳","🥸","😎","🤓",
      "🧐","😕","🫤","😟","🙁","☹️","😮","😯","😲","😳","🥺","🥹","😦","😧","😨","😰",
      "😥","😢","😭","😱","😖","😣","😞","😓","😩","😫","🥱","😤","😡","😠","🤬","😈",
      "👿","💀","☠️","💩","🤡","👹","👺","👻","👽","👾","🤖","😺","😸","😹","😻","😼",
      "😽","🙀","😿","😾","🙈","🙉","🙊","💋","💌","💘","💝","💖","💗","💓","💞","💕",
      "💟","❣️","💔","❤️‍🔥","❤️‍🩹","❤️","🧡","💛","💚","💙","💜","🤎","🖤","🤍","💯","💢",
      "💥","💫","💦","💨","🕳️","💣","💬","👁️‍🗨️","🗨️","🗯️","💭","💤",
      "👋","🤚","🖐️","✋","🖖","🫱","🫲","🫳","🫴","👌","🤌","🤏","✌️","🤞","🫰","🤟",
      "🤘","🤙","👈","👉","👆","🖕","👇","☝️","🫵","👍","👎","✊","👊","🤛","🤜","👏",
      "🙌","🫶","👐","🤲","🤝","🙏","✍️","💅","🤳","💪","🦾","🦿","🦵","🦶","👂","🦻",
      "👃","🧠","🫀","🫁","🦷","🦴","👀","👁️","👅","👄","🫦","👶","🧒","👦","👧","🧑",
      "👱","👨","🧔","👩","🧓","👴","👵","🙍","🙎","🙅","🙆","💁","🙋","🧏","🙇","🤦",
      "🤷","👮","🕵️","💂","🥷","👷","🫅","🤴","👸","👳","👲","🧕","🤵","👰","🤰","🫃",
      "🫄","🤱","👼","🎅","🤶","🦸","🦹","🧙","🧚","🧛","🧜","🧝","🧞","🧟","🧌","💆",
      "💇","🚶","🧍","🧎","🏃","💃","🕺","🕴️","👯","🧖","🧗","🤸","⛹️","🏋️","🚴","🚵",
      "🤼","🤽","🤾","🤺","⛷️","🏂","🏌️","🏇","🏊","🤹","🧘","🛀","🛌",
      "👭","👫","👬","💏","💑","👪","👨‍👩‍👦","👨‍👩‍👧","👨‍👩‍👧‍👦","👨‍👩‍👦‍👦","👨‍👩‍👧‍👧","👨‍👦","👨‍👦‍👦","👨‍👧","👨‍👧‍👦","👨‍👧‍👧",
      "👩‍👦","👩‍👦‍👦","👩‍👧","👩‍👧‍👦","👩‍👧‍👧","🗣️","👤","👥","🫂","👣"
    ]
  },
  {
    id: "animals",
    name: "Animals & Nature",
    icon: <Coffee className="h-4 w-4" />,
    emojis: [
      "🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐻‍❄️","🐨","🐯","🦁","🐮","🐷","🐽","🐸",
      "🐵","🙈","🙉","🙊","🐒","🐔","🐧","🐦","🐤","🐣","🐥","🦆","🦅","🦉","🦇","🐺",
      "🐗","🐴","🦄","🐝","🪱","🐛","🦋","🐌","🐞","🐜","🪰","🪲","🪳","🦟","🦗","🕷️",
      "🕸️","🦂","🐢","🐍","🦎","🦖","🦕","🐙","🦑","🦐","🦞","🦀","🐡","🐠","🐟","🐬",
      "🐳","🐋","🦈","🪸","🐊","🐅","🐆","🦓","🦍","🦧","🐘","🦛","🦏","🐪","🐫","🦒",
      "🦘","🦬","🐃","🐂","🐄","🐎","🐖","🐏","🐑","🦙","🐐","🦌","🐕","🐩","🦮","🐕‍🦺",
      "🐈","🐈‍⬛","🪶","🐓","🦃","🦤","🦚","🦜","🦢","🦩","🕊️","🐇","🦝","🦨","🦡","🦫",
      "🦦","🦥","🐁","🐀","🐿️","🦔","🐾","🐉","🐲",
      "🌵","🎄","🌲","🌳","🌴","🪵","🌱","🌿","☘️","🍀","🎍","🪴","🎋","🍃","🍂","🍁",
      "🪺","🪹","🍄","🌾","💐","🌷","🌹","🥀","🌺","🌸","🌼","🌻","🌞","🌝","🌛","🌜",
      "🌚","🌕","🌖","🌗","🌘","🌑","🌒","🌓","🌔","🌙","🌎","🌍","🌏","🪐","💫","⭐",
      "🌟","✨","⚡","☄️","💥","🔥","🌪️","🌈","☀️","🌤️","⛅","🌥️","☁️","🌦️","🌧️","⛈️",
      "🌩️","🌨️","❄️","☃️","⛄","🌬️","💨","💧","💦","🫧","☔","☂️","🌊","🌫️"
    ]
  },
  {
    id: "food",
    name: "Food & Drink",
    icon: <Coffee className="h-4 w-4" />,
    emojis: [
      "🍇","🍈","🍉","🍊","🍋","🍌","🍍","🥭","🍎","🍏","🍐","🍑","🍒","🍓","🫐","🥝",
      "🍅","🫒","🥥","🥑","🍆","🥔","🥕","🌽","🌶️","🫑","🥒","🥬","🥦","🧄","🧅","🍄",
      "🥜","🫘","🌰","🍞","🥐","🥖","🫓","🥨","🥯","🥞","🧇","🧀","🍖","🍗","🥩","🥓",
      "🍔","🍟","🍕","🌭","🥪","🌮","🌯","🫔","🥙","🧆","🥚","🍳","🥘","🍲","🫕","🥣",
      "🥗","🍿","🧈","🧂","🥫","🍱","🍘","🍙","🍚","🍛","🍜","🍝","🍠","🍢","🍣","🍤",
      "🍥","🥮","🍡","🥟","🥠","🥡","🦀","🦞","🦐","🦑","🦪","🍦","🍧","🍨","🍩","🍪",
      "🎂","🍰","🧁","🥧","🍫","🍬","🍭","🍮","🍯","🍼","🥛","☕","🫖","🍵","🍶","🍾",
      "🍷","🍸","🍹","🍺","🍻","🥂","🥃","🫗","🥤","🧋","🧃","🧉","🧊","🥢","🍽️","🍴","🥄","🔪","🫙","🏺"
    ]
  },
  {
    id: "activities",
    name: "Activities",
    icon: <Lightbulb className="h-4 w-4" />,
    emojis: [
      "⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🎱","🪀","🏓","🏸","🏒","🏑","🥍",
      "🏏","🪃","🥅","⛳","🪁","🏹","🎣","🤿","🥊","🥋","🎽","🛹","🛼","🛷","⛸️","🥌",
      "🎿","⛷️","🏂","🪂","🏋️","🤼","🤸","🤺","⛹️","🤾","🏌️","🏇","🧘","🏄","🏊","🤽",
      "🚣","🧗","🚵","🚴","🏆","🥇","🥈","🥉","🏅","🎖️","🏵️","🎗️","🎫","🎟️","🎪","🤹",
      "🎭","🩰","🎨","🎬","🎤","🎧","🎼","🎹","🥁","🪘","🎷","🎺","🪗","🎸","🪕","🎻",
      "🎲","♟️","🎯","🎳","🎮","🕹️","🎰","🧩","🪩"
    ]
  },
  {
    id: "travel",
    name: "Travel & Places",
    icon: <Plane className="h-4 w-4" />,
    emojis: [
      "🚗","🚕","🚙","🚌","🚎","🏎️","🚓","🚑","🚒","🚐","🛻","🚚","🚛","🚜","🏍️","🛵",
      "🦽","🦼","🛺","🚲","🛴","🛹","🛼","🚏","🛣️","🛤️","🛞","⛽","🛞","🚨","🚥","🚦",
      "🛑","🚧","⚓","🛟","⛵","🛶","🚤","🛳️","⛴️","🛥️","🚢","✈️","🛩️","🛫","🛬","🪂",
      "💺","🚁","🚟","🚠","🚡","🛰️","🚀","🛸","🛎️","🧳","⌛","⏳","⌚","⏰","⏱️","⏲️",
      "🕰️","🌡️","🗺️","🧭","🎠","🛝","🎡","🎢","💈","🎪","🚂","🚃","🚄","🚅","🚆","🚇",
      "🚈","🚉","🚊","🚝","🚞","🚋","🚌","🚍","🚎","🚐","🚑","🚒","🚓","🚔","🚕","🚖",
      "🏠","🏡","🏢","🏣","🏤","🏥","🏦","🏨","🏩","🏪","🏫","🏬","🏭","🏯","🏰","💒",
      "🗼","🗽","⛪","🕌","🛕","🕍","⛩️","🕋","⛲","⛺","🌁","🌃","🏙️","🌄","🌅","🌆",
      "🌇","🌉","♨️","🎠","🛝","🎡","🎢","💈","🎪","🗾","🏔️","⛰️","🌋","🗻","🏕️","🏖️",
      "🏜️","🏝️","🏞️"
    ]
  },
  {
    id: "objects",
    name: "Objects",
    icon: <Lightbulb className="h-4 w-4" />,
    emojis: [
      "⌚","📱","📲","💻","⌨️","🖥️","🖨️","🖱️","🖲️","🕹️","🗜️","💽","💾","💿","📀","📼",
      "📷","📸","📹","🎥","📽️","🎞️","📞","☎️","📟","📠","📺","📻","🎙️","🎚️","🎛️","🧭",
      "⏱️","⏲️","⏰","🕰️","⌛","⏳","📡","🔋","🪫","🔌","💡","🔦","🕯️","🪔","🧯","🛢️",
      "💸","💵","💴","💶","💷","🪙","💰","💳","🪪","💎","⚖️","🪜","🧰","🪛","🔧","🔨",
      "⚒️","🛠️","⛏️","🪚","🔩","⚙️","🪤","🧱","⛓️","🧲","🔫","💣","🧨","🪓","🔪","🗡️",
      "⚔️","🛡️","🚬","⚰️","🪦","⚱️","🏺","🔮","📿","🧿","🪬","💈","⚗️","🔭","🔬","🕳️",
      "🩹","🩺","🩻","🩼","💊","💉","🩸","🧬","🦠","🧫","🧪","🌡️","🧹","🪠","🧺","🧻",
      "🚽","🚰","🚿","🛁","🛀","🧼","🪥","🪒","🧽","🪣","🧴","🛎️","🔑","🗝️","🚪","🪑",
      "🛋️","🛏️","🛌","🧸","🪆","🖼️","🪞","🪟","🛍️","🛒","🎁","🎈","🎏","🎀","🪄","🪅",
      "🎊","🎉","🎎","🏮","🎐","🧧","✉️","📩","📨","📧","💌","📥","📤","📦","🏷️","🪧",
      "📪","📫","📬","📭","📮","📯","📜","📃","📄","📑","🧾","📊","📈","📉","🗒️","🗓️",
      "📆","📅","🗑️","📇","🗃️","🗳️","🗄️","📋","📁","📂","🗂️","🗞️","📰","📓","📔","📒",
      "📕","📗","📘","📙","📚","📖","🔖","🧷","🔗","📎","🖇️","📐","📏","🧮","📌","📍",
      "✂️","🖊️","🖋️","✒️","🖌️","🖍️","📝","✏️","🔍","🔎","🔏","🔐","🔒","🔓"
    ]
  },
  {
    id: "symbols",
    name: "Symbols",
    icon: <Hash className="h-4 w-4" />,
    emojis: [
      "❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","❤️‍🔥","❤️‍🩹","💔","❣️","💕","💞","💓",
      "💗","💖","💘","💝","💟","☮️","✝️","☪️","🕉️","☸️","✡️","🔯","🕎","☯️","☦️","🛐",
      "⛎","♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓","🆔","⚛️","🉑",
      "☢️","☣️","📴","📳","🈶","🈚","🈸","🈺","🈷️","✴️","🆚","💮","🉐","㊙️","㊗️","🈴",
      "🈵","🈹","🈲","🅰️","🅱️","🆎","🆑","🅾️","🆘","❌","⭕","🛑","⛔","📛","🚫","💯",
      "💢","♨️","🚷","🚯","🚳","🚱","🔞","📵","🚭","❗","❕","❓","❔","‼️","⁉️","🔅",
      "🔆","〽️","⚠️","🚸","🔱","⚜️","🔰","♻️","✅","🈯","💹","❇️","✳️","❎","🌐","💠",
      "Ⓜ️","🌀","💤","🏧","🚾","♿","🅿️","🛗","🈳","🈂️","🛂","🛃","🛄","🛅","🚹","🚺",
      "🚼","⚧️","🚻","🚮","🎦","📶","🈁","🔣","ℹ️","🔤","🔡","🔠","🆖","🆗","🆙","🆒",
      "🆕","🆓","0️⃣","1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟","🔢","#️⃣","*️⃣",
      "⏏️","▶️","⏸️","⏯️","⏹️","⏺️","⏭️","⏮️","⏩","⏪","⏫","⏬","◀️","🔼","🔽","➡️",
      "⬅️","⬆️","⬇️","↗️","↘️","↙️","↖️","↕️","↔️","↩️","↪️","⤴️","⤵️","🔀","🔁","🔂",
      "🔄","🔃","🎵","🎶","➕","➖","➗","✖️","🟰","♾️","💲","💱","™️","©️","®️","〰️",
      "➰","➿","🔚","🔙","🔛","🔝","🔜","✔️","☑️","🔘","🔴","🟠","🟡","🟢","🔵","🟣",
      "⚫","⚪","🟤","🔺","🔻","🔸","🔹","🔶","🔷","🔳","🔲","▪️","▫️","◾","◽","◼️",
      "◻️","🟥","🟧","🟨","🟩","🟦","🟪","⬛","⬜","🟫","🔈","🔇","🔉","🔊","🔔","🔕",
      "📣","📢","👁️‍🗨️","💬","💭","🗯️","♠️","♣️","♥️","♦️","🃏","🎴","🀄","🕐","🕑","🕒",
      "🕓","🕔","🕕","🕖","🕗","🕘","🕙","🕚","🕛","🕜","🕝","🕞","🕟","🕠","🕡","🕢","🕣","🕤","🕥","🕦","🕧"
    ]
  },
  {
    id: "flags",
    name: "Flags",
    icon: <Flag className="h-4 w-4" />,
    emojis: [
      "🏁","🚩","🎌","🏴","🏳️","🏳️‍🌈","🏳️‍⚧️","🏴‍☠️",
      "🇦🇫","🇦🇱","🇩🇿","🇦🇸","🇦🇩","🇦🇴","🇦🇮","🇦🇶","🇦🇬","🇦🇷","🇦🇲","🇦🇼","🇦🇺","🇦🇹","🇦🇿","🇧🇸",
      "🇧🇭","🇧🇩","🇧🇧","🇧🇾","🇧🇪","🇧🇿","🇧🇯","🇧🇲","🇧🇹","🇧🇴","🇧🇦","🇧🇼","🇧🇷","🇮🇴","🇻🇬","🇧🇳",
      "🇧🇬","🇧🇫","🇧🇮","🇰🇭","🇨🇲","🇨🇦","🇮🇨","🇨🇻","🇧🇶","🇰🇾","🇨🇫","🇹🇩","🇨🇱","🇨🇳","🇨🇽","🇨🇨",
      "🇨🇴","🇰🇲","🇨🇬","🇨🇩","🇨🇰","🇨🇷","🇨🇮","🇭🇷","🇨🇺","🇨🇼","🇨🇾","🇨🇿","🇩🇰","🇩🇯","🇩🇲","🇩🇴",
      "🇪🇨","🇪🇬","🇸🇻","🇬🇶","🇪🇷","🇪🇪","🇸🇿","🇪🇹","🇪🇺","🇫🇰","🇫🇴","🇫🇯","🇫🇮","🇫🇷","🇬🇫","🇵🇫",
      "🇬🇦","🇬🇲","🇬🇪","🇩🇪","🇬🇭","🇬🇮","🇬🇷","🇬🇱","🇬🇩","🇬🇵","🇬🇺","🇬🇹","🇬🇬","🇬🇳","🇬🇼","🇬🇾",
      "🇭🇹","🇭🇳","🇭🇰","🇭🇺","🇮🇸","🇮🇳","🇮🇩","🇮🇷","🇮🇶","🇮🇪","🇮🇲","🇮🇱","🇮🇹","🇯🇲","🇯🇵","🎌",
      "🇯🇪","🇯🇴","🇰🇿","🇰🇪","🇰🇮","🇽🇰","🇰🇼","🇰🇬","🇱🇦","🇱🇻","🇱🇧","🇱🇸","🇱🇷","🇱🇾","🇱🇮","🇱🇹",
      "🇱🇺","🇲🇴","🇲🇬","🇲🇼","🇲🇾","🇲🇻","🇲🇱","🇲🇹","🇲🇭","🇲🇶","🇲🇷","🇲🇺","🇾🇹","🇲🇽","🇫🇲","🇲🇩",
      "🇲🇨","🇲🇳","🇲🇪","🇲🇸","🇲🇦","🇲🇿","🇲🇲","🇳🇦","🇳🇷","🇳🇵","🇳🇱","🇳🇨","🇳🇿","🇳🇮","🇳🇪","🇳🇬",
      "🇳🇺","🇳🇫","🇰🇵","🇲🇰","🇲🇵","🇳🇴","🇴🇲","🇵🇰","🇵🇼","🇵🇸","🇵🇦","🇵🇬","🇵🇾","🇵🇪","🇵🇭","🇵🇳",
      "🇵🇱","🇵🇹","🇵🇷","🇶🇦","🇷🇪","🇷🇴","🇷🇺","🇷🇼","🇼🇸","🇸🇲","🇸🇹","🇸🇦","🇸🇳","🇷🇸","🇸🇨","🇸🇱",
      "🇸🇬","🇸🇽","🇸🇰","🇸🇮","🇬🇸","🇸🇧","🇸🇴","🇿🇦","🇰🇷","🇸🇸","🇪🇸","🇱🇰","🇧🇱","🇸🇭","🇰🇳","🇱🇨",
      "🇵🇲","🇻🇨","🇸🇩","🇸🇷","🇸🇪","🇨🇭","🇸🇾","🇹🇼","🇹🇯","🇹🇿","🇹🇭","🇹🇱","🇹🇬","🇹🇰","🇹🇴","🇹🇹",
      "🇹🇳","🇹🇷","🇹🇲","🇹🇨","🇹🇻","🇻🇮","🇺🇬","🇺🇦","🇦🇪","🇬🇧","🏴󠁧󠁢󠁥󠁮󠁧󠁿","🏴󠁧󠁢󠁳󠁣󠁴󠁿","🏴󠁧󠁢󠁷󠁬󠁳󠁿","🇺🇸","🇺🇾","🇺🇿",
      "🇻🇺","🇻🇦","🇻🇪","🇻🇳","🇼🇫","🇪🇭","🇾🇪","🇿🇲","🇿🇼"
    ]
  }
];

/* Simple emoji name map for search (subset of common ones) */
const EMOJI_SEARCH_KEYWORDS: Record<string, string[]> = {
  "😀": ["grinning", "happy", "smile"],
  "😃": ["smiley", "happy"],
  "😄": ["smile", "happy", "joy"],
  "😁": ["grin", "happy"],
  "😆": ["laughing", "satisfied"],
  "😅": ["sweat", "smile", "nervous"],
  "🤣": ["rofl", "rolling", "laughing"],
  "😂": ["joy", "tears", "laughing", "lol", "funny"],
  "😉": ["wink"],
  "😊": ["blush", "happy", "smile"],
  "😍": ["heart", "eyes", "love"],
  "🥰": ["love", "hearts", "face"],
  "😘": ["kiss", "love"],
  "😋": ["yummy", "delicious", "tongue"],
  "😎": ["cool", "sunglasses"],
  "🤩": ["star", "struck", "excited"],
  "😭": ["crying", "sad", "sob"],
  "😡": ["angry", "mad", "rage"],
  "😠": ["angry"],
  "🤬": ["swearing", "cursing"],
  "😱": ["scream", "scared", "shock"],
  "😳": ["flushed", "embarrassed"],
  "🥺": ["pleading", "puppy", "please"],
  "😴": ["sleeping", "zzz"],
  "🤔": ["thinking", "hmm"],
  "🤗": ["hugging", "hug"],
  "🤮": ["vomit", "sick", "puke"],
  "🥵": ["hot", "sweating"],
  "🥶": ["cold", "freezing"],
  "🤯": ["mind", "blown", "exploding"],
  "🤡": ["clown"],
  "💀": ["skull", "dead"],
  "👻": ["ghost"],
  "👽": ["alien"],
  "🤖": ["robot"],
  "💩": ["poop", "shit"],
  "👍": ["thumbs", "up", "yes", "ok", "good", "like"],
  "👎": ["thumbs", "down", "no", "bad", "dislike"],
  "👋": ["wave", "hello", "hi", "bye"],
  "👏": ["clap", "applause"],
  "🙏": ["pray", "please", "thanks", "namaste"],
  "💪": ["muscle", "strong", "flex"],
  "✌️": ["peace", "victory"],
  "🤞": ["fingers", "crossed", "luck"],
  "🤟": ["love", "you", "hand"],
  "🖕": ["middle", "finger"],
  "❤️": ["heart", "love", "red"],
  "🧡": ["heart", "orange"],
  "💛": ["heart", "yellow"],
  "💚": ["heart", "green"],
  "💙": ["heart", "blue"],
  "💜": ["heart", "purple"],
  "🖤": ["heart", "black"],
  "🤍": ["heart", "white"],
  "💔": ["broken", "heart"],
  "🔥": ["fire", "hot", "lit"],
  "✨": ["sparkles", "stars", "shine"],
  "⭐": ["star"],
  "🌟": ["glowing", "star"],
  "💯": ["hundred", "100", "perfect", "score"],
  "✅": ["check", "done", "yes", "correct"],
  "❌": ["cross", "no", "wrong", "delete"],
  "🎉": ["party", "celebration", "tada"],
  "🎊": ["confetti"],
  "🎂": ["birthday", "cake"],
  "🎁": ["gift", "present"],
  "🏆": ["trophy", "winner", "champion"],
  "🥇": ["gold", "medal", "first"],
  "⚽": ["soccer", "football"],
  "🏀": ["basketball"],
  "🏈": ["football", "american"],
  "🎮": ["gaming", "controller", "video", "game"],
  "🎵": ["music", "note"],
  "🎶": ["music", "notes"],
  "📱": ["phone", "mobile"],
  "💻": ["laptop", "computer"],
  "🌈": ["rainbow"],
  "☀️": ["sun", "sunny"],
  "🌙": ["moon", "night"],
  "⛈️": ["storm", "thunder"],
  "❄️": ["snow", "cold", "winter"],
  "🐶": ["dog", "puppy"],
  "🐱": ["cat", "kitty"],
  "🐻": ["bear"],
  "🦊": ["fox"],
  "🦁": ["lion"],
  "🐸": ["frog"],
  "🐵": ["monkey"],
  "🦄": ["unicorn"],
  "🐍": ["snake"],
  "🐢": ["turtle"],
  "🐬": ["dolphin"],
  "🦈": ["shark"],
  "🐘": ["elephant"],
  "🍕": ["pizza"],
  "🍔": ["burger", "hamburger"],
  "🍟": ["fries", "french"],
  "🌮": ["taco"],
  "🍦": ["ice", "cream"],
  "🍩": ["donut", "doughnut"],
  "☕": ["coffee"],
  "🍺": ["beer"],
  "🍷": ["wine"],
  "🚗": ["car", "automobile"],
  "✈️": ["airplane", "plane", "flight"],
  "🚀": ["rocket", "launch"],
  "🏠": ["house", "home"],
  "💰": ["money", "bag"],
  "💎": ["diamond", "gem"],
  "🔔": ["bell", "notification"],
  "🔒": ["lock", "locked", "secure"],
  "🔓": ["unlock", "unlocked"],
  "🇮🇳": ["india", "indian"],
  "🇺🇸": ["usa", "america", "united", "states"],
  "🇬🇧": ["uk", "britain", "england"],
  "👀": ["eyes", "look", "see"],
  "🗣️": ["speaking", "talking"],
  "💤": ["sleep", "zzz"],
  "🎤": ["microphone", "sing", "karaoke"],
  "📸": ["camera", "photo"],
  "🎬": ["movie", "film", "action"],
  "📚": ["books", "study", "read"],
  "✏️": ["pencil", "write"],
  "💊": ["pill", "medicine"],
  "🧪": ["test", "tube", "science"],
};

const FREQUENTLY_USED_KEY = "notrace_frequent_emojis";
const MAX_FREQUENT = 24;

function getFrequentEmojis(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(FREQUENTLY_USED_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveFrequentEmoji(emoji: string) {
  try {
    const current = getFrequentEmojis();
    const filtered = current.filter((e) => e !== emoji);
    const updated = [emoji, ...filtered].slice(0, MAX_FREQUENT);
    localStorage.setItem(FREQUENTLY_USED_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

/* ──────────────────────────── Component ──────────────────────────── */

export function EmojiPicker({
  onSelect,
  className
}: {
  onSelect: (emoji: string) => void;
  className?: string;
}) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("smileys");
  const scrollRef = useRef<HTMLDivElement>(null);
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [frequentEmojis, setFrequentEmojis] = useState(getFrequentEmojis);

  const handleSelect = useCallback((emoji: string) => {
    saveFrequentEmoji(emoji);
    setFrequentEmojis(getFrequentEmojis());
    onSelect(emoji);
  }, [onSelect]);

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    const results: string[] = [];
    const seen = new Set<string>();

    // Search through all categories
    for (const cat of EMOJI_CATEGORIES) {
      for (const emoji of cat.emojis) {
        if (seen.has(emoji)) continue;
        // Check keyword map
        const keywords = EMOJI_SEARCH_KEYWORDS[emoji];
        if (keywords?.some((kw) => kw.includes(q))) {
          results.push(emoji);
          seen.add(emoji);
        }
      }
    }

    // Also match any emoji that literally contains the search text (for searching by emoji itself)
    if (results.length < 50) {
      for (const cat of EMOJI_CATEGORIES) {
        for (const emoji of cat.emojis) {
          if (seen.has(emoji)) continue;
          if (emoji.includes(q)) {
            results.push(emoji);
            seen.add(emoji);
          }
        }
      }
    }

    return results;
  }, [search]);

  const scrollToCategory = (catId: string) => {
    setActiveCategory(catId);
    const el = categoryRefs.current[catId];
    if (el && scrollRef.current) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className={cn(
      "flex flex-col w-[320px] h-[400px] rounded-xl border border-white/10 bg-[#1a1a2e]/95 backdrop-blur-xl shadow-2xl overflow-hidden",
      className
    )}>
      {/* Search */}
      <div className="px-3 pt-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search emoji..."
            className="h-8 pl-8 pr-8 text-xs bg-white/5 border-white/10 rounded-lg focus-visible:ring-primary/30"
            autoFocus
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Category tabs */}
      {!search && (
        <div className="flex items-center gap-0.5 px-2 pb-1 border-b border-white/5">
          {frequentEmojis.length > 0 && (
            <button
              type="button"
              onClick={() => scrollToCategory("frequent")}
              className={cn(
                "grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground",
                activeCategory === "frequent" && "bg-primary/20 text-primary"
              )}
              title="Frequently Used"
            >
              <Clock className="h-4 w-4" />
            </button>
          )}
          {EMOJI_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => scrollToCategory(cat.id)}
              className={cn(
                "grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground",
                activeCategory === cat.id && "bg-primary/20 text-primary"
              )}
              title={cat.name}
            >
              {cat.icon}
            </button>
          ))}
        </div>
      )}

      {/* Emoji grid */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-2 py-1 scrollbar-thin"
        onScroll={() => {
          if (search || !scrollRef.current) return;
          const scrollTop = scrollRef.current.scrollTop;
          // Find which category is currently visible
          let closestId = "smileys";
          let closestDist = Infinity;
          for (const cat of EMOJI_CATEGORIES) {
            const el = categoryRefs.current[cat.id];
            if (el) {
              const dist = Math.abs(el.offsetTop - scrollTop - 40);
              if (dist < closestDist) {
                closestDist = dist;
                closestId = cat.id;
              }
            }
          }
          if (frequentEmojis.length > 0) {
            const freqEl = categoryRefs.current["frequent"];
            if (freqEl) {
              const dist = Math.abs(freqEl.offsetTop - scrollTop - 40);
              if (dist < closestDist) {
                closestId = "frequent";
              }
            }
          }
          setActiveCategory(closestId);
        }}
      >
        {search ? (
          // Search results
          filteredCategories && filteredCategories.length > 0 ? (
            <div className="grid grid-cols-8 gap-0.5 py-1">
              {filteredCategories.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleSelect(emoji)}
                  className="grid h-8 w-8 place-items-center rounded-md text-xl transition-all hover:bg-white/10 hover:scale-125 active:scale-95"
                >
                  {emoji}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              No emojis found
            </div>
          )
        ) : (
          <>
            {/* Frequently used */}
            {frequentEmojis.length > 0 && (
              <div ref={(el) => { categoryRefs.current["frequent"] = el; }}>
                <div className="sticky top-0 z-10 bg-[#1a1a2e]/95 backdrop-blur px-1 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Frequently Used
                </div>
                <div className="grid grid-cols-8 gap-0.5">
                  {frequentEmojis.map((emoji, i) => (
                    <button
                      key={`freq-${emoji}-${i}`}
                      type="button"
                      onClick={() => handleSelect(emoji)}
                      className="grid h-8 w-8 place-items-center rounded-md text-xl transition-all hover:bg-white/10 hover:scale-125 active:scale-95"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Category sections */}
            {EMOJI_CATEGORIES.map((cat) => (
              <div key={cat.id} ref={(el) => { categoryRefs.current[cat.id] = el; }}>
                <div className="sticky top-0 z-10 bg-[#1a1a2e]/95 backdrop-blur px-1 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {cat.name}
                </div>
                <div className="grid grid-cols-8 gap-0.5">
                  {cat.emojis.map((emoji, i) => (
                    <button
                      key={`${cat.id}-${emoji}-${i}`}
                      type="button"
                      onClick={() => handleSelect(emoji)}
                      className="grid h-8 w-8 place-items-center rounded-md text-xl transition-all hover:bg-white/10 hover:scale-125 active:scale-95"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
