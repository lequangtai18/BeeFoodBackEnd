var commentModel = require("../models/comment.model");
exports.getComment = async (req, res, next) => {
  try {
    let list = await commentModel.commentModel
      .find()
      .populate({ path: "idUser", select: "username avatar" })
      .populate({ path: "idProduct", select: "name images _id" })
      .exec();
    if (list && list.length > 0) {
      return res
        .status(200)
        .json({ data: list, msg: "Lấy dữ liệu comment thành công" });
    } else {
      return res.status(404).json({ msg: "Không có dữ liệu comment" });
    }
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu comment:", error);
    return res
      .status(500)
      .json({ msg: "Có lỗi xảy ra khi lấy dữ liệu comment" });
  }
};
exports.getAllComment = async (req, res, next) => {
  try {
    let list = await commentModel.commentModel
      .find()
      .populate({ path: "idUser", select: "username avatar" })
      .populate({ path: "idProduct", select: "name images _id" })
      .exec();
    return list;
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

exports.postComment = async (req, res, next) => {
  console.log(req.body);
  try {
    const comment = new commentModel.commentModel(req.body);

    let new_comment = await comment.save();

    return res.status(200).json({ comment: new_comment });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: error.message });
  }
};


exports.updateComment = async (req, res, next) => {
  const { id } = req.params;
  const { title } = req.body;

  try {
    const updatedComment = await commentModel.commentModel.findByIdAndUpdate(
      id,
      { title },
      { new: true, runValidators: true }
    ).populate({ path: "idUser", select: "username avatar" })
      .populate({ path: "idProduct", select: "name images _id" });

    if (!updatedComment) {
      return res.status(404).json({ msg: "Không tìm thấy bình luận" });
    }

    return res.status(200).json({
      comment: updatedComment,
      msg: "Cập nhật bình luận thành công"
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật bình luận:", error);
    return res.status(500).json({ msg: "Có lỗi xảy ra khi cập nhật bình luận" });
  }
};