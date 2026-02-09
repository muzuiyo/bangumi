
type Props = {
    wantNum: number,
    doingNum: number,
    doneNum: number,
    onHoldNum: number,
    droppedNum: number
}

const InfoBanner = (recordNum: Props) => {
    return (
        <div>
            目前计划完成 {recordNum.wantNum} 部作品， {recordNum.doingNum} 部作品进行中，已完成 {recordNum.doneNum} 部作品
        </div>
    )
}

export default InfoBanner;