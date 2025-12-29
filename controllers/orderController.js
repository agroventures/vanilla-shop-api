import Order from "../models/Order.js";

export const createOrder = async (req, res) => {
    try {
        const order = await Order.create(req.body);
        res.status(201).json({ message: "Order created successfully", order });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find();
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

export const getOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

export const updateOrder = async (req, res) => {
    try {
        const order = await Order.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true });
        res.status(200).json({ message: "Order updated successfully", order });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
}; 

export const deleteOrder = async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Order deleted successfully"});
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};