import xiaoxinPng from "@/assets/images/threeCourse/xiaoxin.png"
// data.ts
export interface Data{
    id: number;
    name: string;  // 姓名
    headPortrait: string;  // 头像url
    callName: string;  // 称呼
    [propName:string]:any;
}
export interface TreeData extends Data {
    children?: Data[]
    mate?: Data[]
}

const genealogTreeData:Data =
    {
        "id": 1,
        "name": "*某某*",
        "headPortrait": xiaoxinPng,
        "callName": "父亲",
        "mate": [
            {
                "id": 2,
                "name": "*某某*",
                "headPortrait": xiaoxinPng,
                "callName": "母亲",
                "mate": []
            }
        ],
        "children": [
            {
                "id": 3,
                "name": "*某某*",
                "headPortrait": xiaoxinPng,
                "callName": "本人",
                "mate": []
            },
            {
                "id": 4,
                "name": "*某某*",
                "headPortrait": xiaoxinPng,
                "callName": "兄弟",
                "children": [
                    {
                        "id": 5,
                        "name": "*某某*",
                        "headPortrait": xiaoxinPng,
                        "callName": "儿子",
                        "children": [],
                        "mate": []
                    },
                    {
                        "id": 6,
                        "name": "*某某*",
                        "headPortrait": xiaoxinPng,
                        "callName": "儿子",
                        "children": [],
                        "mate": []
                    }
                ],
                "mate": []
            },
            {
                "id": 7,
                "name": "*某某*",
                "headPortrait": xiaoxinPng,
                "callName": "妹妹",
                "children": [],
                "mate": [
                    {
                        "id":8,
                        "name": "*某某*",
                        "headPortrait": xiaoxinPng,
                        "callName": "妹夫",
                        "children": [],
                        "mate": []
                    }
                ]
            }
        ],

    }

export default genealogTreeData
