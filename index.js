var M_WIDTH=800, M_HEIGHT=450;
var app, assets={},fbs,SERV_TM, game_name='pool', yndx_payments, game, client_id, objects={}, state='',my_role="", game_tick=0, made_moves=0, game_id=0, my_turn=0, opponent=0,connected = 1, LANG = 0, hidden=0, h_state=0, game_platform="",git_src='./', room_name = '',game_name='pool',pending_player='',tm={}, some_process = {}, my_data={opp_id : ''},opp_data={};

const WIN = 1, DRAW = 0, LOSE = -1, NOSYNC = 2;
const borders=[[93.35,401.57,101.88,390.66],[101.88,390.66,101.88,142.41],[101.88,142.41,93.14,131.36],[93.14,131.36,101.88,401.57],[111.76,112.29,122.37,121.73],[122.37,121.73,380.84,121.73],[380.84,121.73,384.71,112.23],[111.76,112.23,384.71,121.73],[689.76,112.25,678.93,121.75],[678.93,121.75,420.29,121.75],[420.29,121.75,417,112.25],[417,112.25,689.76,121.75],[688.9,420.25,677.41,411.22],[677.41,411.22,420.23,411.22],[420.23,411.22,416.22,420.22],[416.22,411.22,688.9,420.25],[111.87,420.21,123.52,411.21],[123.52,411.21,380.04,411.21],[380.04,411.21,385.27,420.21],[111.87,411.21,385.27,420.21],[707.32,400.83,699.05,389.43],[699.05,389.43,698.72,143.65],[698.72,143.65,707.25,132.6],[698.72,132.6,707.32,400.83]];
const holes=[[93.36,112.5,1,1],[400.34,100.05,0,1],[707.33,112.5,-1,1],[93.36,419.35,1,-1],[400.34,431.32,0,-1],[707.33,418.35,-1,-1]];
const all_borders=[];
const TINTS={'red':{bcg:0xff7777,strip:0xff0000},'blue':{bcg:0x9999ff,strip:0x0000ff},'black':{bcg:0x333333,strip:0x666666},'white':{bcg:0xaaaaaa,strip:0xffffff}}
const STAT_LS_KEY='pool_sp_stat';

r2 = (v)=>{	
	return (v >= 0 || -1) * Math.round(Math.abs(v)*10000)/10000;	
}

quat={
	
	multiply( a, b ) {

		let q = {};

		const qax = a.x, qay = a.y, qaz = a.z, qaw = a.w;
		const qbx = b.x, qby = b.y, qbz = b.z, qbw = b.w;

		q.x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
		q.y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
		q.z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
		q.w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;

		return q;
	},

	normalizeVector(vector) {
	  const x = vector.x;
	  const y = vector.y;
	  const z = vector.z;

	  const magnitude = Math.sqrt(x * x + y * y + z * z);

	  if (magnitude !== 0) {
		vector.x=x / magnitude,
		vector.y=y / magnitude,
		vector.z=z / magnitude
	  } else {
		throw new Error("Cannot normalize a zero vector.");
	  }
	},
	
	vec_len2D(vec){
		
		return Math.sqrt(vec.x * vec.x + vec.y * vec.y);
		
	},
	
	create(vec, ang){
		
		this.normalizeVector(vec);
		const q={w:0,x:0,y:0,z:0};
		const halfAngle = ang / 2
		const s = Math.sin(halfAngle);
		q.x = vec.x * s;
		q.y = vec.y * s;
		q.z = vec.z * s;
		q.w = Math.cos( halfAngle );
		return q;
	},
	
	update(q, vec, ang){		
		this.normalizeVector(vec);
		const halfAngle = ang / 2
		const s = Math.sin(halfAngle);
		q.x = vec.x * s;
		q.y = vec.y * s;
		q.z = vec.z * s;
		q.w = Math.cos( halfAngle );
	},
		
	rotate_vec_by_quat(vec, q){
		
		//результат вращения вектора
		const rot_quat2={w:q.w,x:-q.x,y:-q.y,z:-q.z};
		const qm1=this.multiply(q,vec);
		const res=this.multiply(qm1,rot_quat2);
		vec.x=res.x;
		vec.y=res.y;
		vec.z=res.z;
		
	},

	angleToZ(vec) {
		const dotProduct = vec.z;
		const magnitude = Math.sqrt(vec.x * vec.x + vec.y * vec.y + vec.z * vec.z);
		const angleInRadians = Math.acos(dotProduct / magnitude);
		return angleInRadians*180/Math.PI;
	}
	
}

irnd = function(min,max) {	
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

anim3={
		
	c1: 1.70158,
	c2: 1.70158 * 1.525,
	c3: 1.70158 + 1,
	c4: (2 * Math.PI) / 3,
	c5: (2 * Math.PI) / 4.5,
	empty_spr : {x:0,visible:false,ready:true, alpha:0},
			
	slots: new Array(20).fill().map(u => ({obj:{},on:0,block:true,params_num:0,p_resolve:0,progress:0,vis_on_end:false,tm:0,params:new Array(10).fill().map(u => ({param:'x',s:0,f:0,d:0,func:this.linear}))})),
	
	any_on() {
		
		for (let s of this.slots)
			if (s.on&&s.block)
				return true
		return false;		
	},
	
	wait(seconds){		
		return this.add(this.empty_spr,{x:[0,1,'linear']}, false, seconds);		
	},
	
	linear(x) {
		return x
	},
	
	kill_anim(obj) {
		
		for (var i=0;i<this.slots.length;i++){
			const slot=this.slots[i];
			if (slot.on&&slot.obj===obj){
				slot.p_resolve(2);
				slot.on=0;				
			}
		}	
	},
	
	easeOutBack(x) {
		return 1 + this.c3 * Math.pow(x - 1, 3) + this.c1 * Math.pow(x - 1, 2);
	},
	
	easeOutElastic(x) {
		return x === 0
			? 0
			: x === 1
			? 1
			: Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * this.c4) + 1;
	},
	
	easeOutSine(x) {
		return Math.sin( x * Math.PI * 0.5);
	},
	
	easeOutQuart(x){		
		return 1 - Math.pow(1 - x, 4);		
	},
	
	easeOutCubic(x) {
		return 1 - Math.pow(1 - x, 3);
	},
	
	flick(x){
		
		return Math.abs(Math.sin(x*6.5*3.141593));
		
	},
		
	easeInBack(x) {
		return this.c3 * x * x * x - this.c1 * x * x;
	},
	
	easeInQuad(x) {
		return x * x;
	},
	
	easeOutBounce(x) {
		const n1 = 7.5625;
		const d1 = 2.75;

		if (x < 1 / d1) {
			return n1 * x * x;
		} else if (x < 2 / d1) {
			return n1 * (x -= 1.5 / d1) * x + 0.75;
		} else if (x < 2.5 / d1) {
			return n1 * (x -= 2.25 / d1) * x + 0.9375;
		} else {
			return n1 * (x -= 2.625 / d1) * x + 0.984375;
		}
	},
	
	easeInCubic(x) {
		return x * x * x;
	},
	
	ease3peaks(x){

		if (x < 0.16666) {
			return x / 0.16666;
		} else if (x < 0.33326) {
			return 1-(x - 0.16666) / 0.16666;
		} else if (x < 0.49986) {
			return (x - 0.3326) / 0.16666;
		} else if (x < 0.66646) {
			return 1-(x - 0.49986) / 0.16666;
		} else if (x < 0.83306) {
			return (x - 0.6649) / 0.16666;
		} else if (x >= 0.83306) {
			return 1-(x - 0.83306) / 0.16666;
		}		
	},
	
	ease2back(x) {
		return Math.sin(x*Math.PI);
	},
	
	easeInOutCubic(x) {
		
		return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
	},
	
	easeInOutBack(x) {

		return x < 0.5
		  ? (Math.pow(2 * x, 2) * ((this.c2 + 1) * 2 * x - this.c2)) / 2
		  : (Math.pow(2 * x - 2, 2) * ((this.c2 + 1) * (x * 2 - 2) + this.c2) + 2) / 2;
	},
	
	shake(x) {
		
		return Math.sin(x*2 * Math.PI);	
		
		
	},	
	
	add (obj, inp_params, vis_on_end, time, block) {
				
		//если уже идет анимация данного спрайта то отменяем ее
		anim3.kill_anim(obj);


		let found=false;
		//ищем свободный слот для анимации
		for (let i = 0; i < this.slots.length; i++) {

			const slot=this.slots[i];
			if (slot.on) continue;
			
			found=true;
			
			obj.visible = true;
			obj.ready = false;
					
			//заносим базовые параметры слота
			slot.on=1;
			slot.params_num=Object.keys(inp_params).length;			
			slot.obj=obj;
			slot.vis_on_end=vis_on_end;
			slot.block=block===undefined;
			slot.speed=0.01818 / time;
			slot.progress=0;			
			
			//добавляем дельту к параметрам и устанавливаем начальное положение
			let ind=0;
			for (const param in inp_params) {
				
				const s=inp_params[param][0];
				let f=inp_params[param][1];
				const d=f-s;					

								
				//для возвратных функцие конечное значение равно начальному что в конце правильные значения присвоить
				const func_name=inp_params[param][2];
				const func=anim3[func_name].bind(anim3);		
				if (func_name === 'ease2back'||func_name==='shake') f=s;				
				
				slot.params[ind].param=param;
				slot.params[ind].s=s;
				slot.params[ind].f=f;
				slot.params[ind].d=d;
				slot.params[ind].func=func;
				ind++;

				//фиксируем начальное значение параметра
				obj[param]=s;
			}
			
			return new Promise(resolve=>{
				slot.p_resolve = resolve;	  		  
			});		
		}

		console.log("Кончились слоты анимации");	
		
		//сразу записываем конечные параметры анимации
		for (let param in params)
			obj[param]=params[param][1];
		obj.visible=vis_on_end;
		obj.alpha = 1;
		obj.ready=true;


	},	
	
	process () {
		
		for (var i = 0; i < this.slots.length; i++) {
			const slot=this.slots[i];
			const obj=slot.obj;
			if (slot.on) {
				
				slot.progress+=slot.speed;		
				
				for (let i=0;i<slot.params_num;i++){
					
					const param_data=slot.params[i];
					const param=param_data.param;
					const s=param_data.s;
					const d=param_data.d;
					const func=param_data.func;
					slot.obj[param]=s+d*func(slot.progress);					
				}
				
				//если анимация завершилась то удаляем слот
				if (slot.progress>=0.999) {
					
					//заносим конечные параметры
					for (let i=0;i<slot.params_num;i++){
						const param=slot.params[i].param;
						const f=slot.params[i].f;
						slot.obj[param]=f;
					}
					
					slot.obj.visible=slot.vis_on_end;
					if(!slot.vis_on_end) slot.obj.alpha=1;
					
					slot.obj.ready=true;
					slot.p_resolve(1);
					slot.on = 0;
				}
			}			
		}		
	}	
}

fbs_once=async function(path){
	const info=await fbs.ref(path).get();
	return info.val();	
}

class lb_player_card_class extends PIXI.Container{

	constructor(x,y,place) {
		super();

		this.bcg=new PIXI.Sprite(assets.lb_player_card_bcg);
		this.bcg.interactive=true;
		this.bcg.pointerover=function(){this.tint=0x55ffff};
		this.bcg.pointerout=function(){this.tint=0xffffff};
		this.bcg.width = 370;
		this.bcg.height = 70;

		this.place=new PIXI.BitmapText('', {fontName: 'mfont',fontSize: 25,align: 'center'});
		this.place.tint=0xffff00;
		this.place.x=20;
		this.place.y=22;

		this.avatar=new PIXI.Sprite();
		this.avatar.x=43;
		this.avatar.y=12;
		this.avatar.width=this.avatar.height=45;


		this.name=new PIXI.BitmapText('', {fontName: 'mfont',fontSize: 22,align: 'center'});
		this.name.tint=0xaaffaa;
		this.name.x=105;
		this.name.y=22;


		this.rating=new PIXI.BitmapText('', {fontName: 'mfont',fontSize: 25,align: 'center'});
		this.rating.x=298;
		this.rating.tint=0xffffff;
		this.rating.y=22;

		this.addChild(this.bcg,this.place, this.avatar, this.name, this.rating);
	}

}

class ball_class extends PIXI.Container{
	
	static BALL_WIDTH=32;
	static BALL_RADIUS=ball_class.BALL_WIDTH*0.36;
	static BALL_DIAMETER=ball_class.BALL_RADIUS*2;
	static BALL_ANIM_FRAMES=40;
	static FRAME_STEP=90/(ball_class.BALL_ANIM_FRAMES-1);
	static HALF_FRAME_STEP=ball_class.FRAME_STEP*0.5;
	static BALL_ANIM_FRAMES2m2=ball_class.BALL_ANIM_FRAMES*2-2;
	static SLOW_DOWN=0.995;
		
	constructor(){
		
		super();
		this.bcg=new PIXI.Sprite(assets.ball_white);
		this.bcg.anchor.set(0.5,0.5);		
		
		this.id=0;
		this.hole_fall_data=[];

		this.z_vec={x:0,y:0,z:1,w:0};
		this.speed=0;
		
		this.glimmer=new PIXI.Sprite(assets.ball_glimmer);
		this.glimmer.anchor.set(0.5,0.5);
		this.glimmer.alpha=0.5;
		
		this.dir={x:0,y:0,z:0};
		this.quaternion=quat.create({x:0.7,y:0.7,z:0},0.01);
				
		this.nearest_point={x:999,y:999,d:999999,l:0};	
		
		this.on=1;
		this.borders_hits_before_potted=0;
		this.balls_hits_before_potted=0;
		
		this.holes_check=1;
	
		this.strip=new PIXI.Sprite(assets.ball_anim0);
		this.strip.anchor.set(0.5,0.5);	
		
		this.addChild(this.bcg,this.strip,this.glimmer);
		this.width=ball_class.BALL_WIDTH;
		this.height=ball_class.BALL_WIDTH;

		this.process=this.move;
		
		this.visible=false;
				
	}
	
	reset(){
		
		this.on=1;
		this.speed=0;
		this.visible=true;
		this.process=this.move;
		this.dir.x=0;
		this.dir.y=0;
		this.dir.z=0;		
		
	}
	
	get_nearest_to_line(nearest,line_data) {

		const x1=line_data[0];
		const y1=line_data[1];
		const x2=line_data[2];
		const y2=line_data[3];

		const A = this.x - x1;
		const B = this.y - y1;
		const C = x2 - x1;
		const D = y2 - y1;

		const dot = A * C + B * D;
		const len_sq = C * C + D * D;
		const param = dot / len_sq;

		if (param < 0) {
			nearest.x = x1;
			nearest.y = y1;
		}
		else if (param > 1) {
			nearest.x = x2;
			nearest.y = y2;
		}
		else {
			nearest.x = x1 + param * C;
			nearest.y = y1 + param * D;
		}
		
		const dx = this.x - nearest.x;
		const dy = this.y - nearest.y;
		nearest.d=dx * dx + dy * dy;
	}
	
	reflect_direction(){
		
		let Nx=this.x-this.nearest_point.x;
		let Ny=this.y-this.nearest_point.y;
		
		const d=Math.sqrt(Nx*Nx+Ny*Ny);
		
		Nx=Nx/d;
		Ny=Ny/d;
		
		const dn2=(this.dir.x*Nx+this.dir.y*Ny)*2;
		
		this.dir.x=r2(this.dir.x-dn2*Nx);
		this.dir.y=r2(this.dir.y-dn2*Ny);
				
	}
			
	set_dir(dx,dy){
		
		this.dir.x=dx;
		this.dir.y=dy;
		
		//определяем скорость по длине вектора
		this.recalc_speed();
			
		//определяем угловую скорость
		this.angular_speed=this.speed/ball_class.BALL_RADIUS;
		
		//определяем кватернион в зависимости от направления
		this.quaternion=quat.create({x:-this.dir.y,y:this.dir.x,z:0},this.angular_speed);
		
	}
	
	random_orientation(){
		
		const ang=Math.random()*Math.PI*2;
		const rand_x=Math.cos(ang);
		const rand_y=Math.sin(ang);
		const rand_ang=Math.random()*0.78+0.4;
		quat.update(this.quaternion,{x:rand_x,y:rand_y,z:0},rand_ang);
		
		
		//вращаем вектор в соответствии с движением
		quat.rotate_vec_by_quat(this.z_vec,this.quaternion);
			
		//определяем ориентацию вектора Z в XY
		const ang_rad=Math.atan2(this.z_vec.y, this.z_vec.x)-Math.PI/2;

		//отклонение от Z чтобы вычислить наклон
		const ang_to_z=quat.angleToZ(this.z_vec);

		let shift_Z_rot=0;
		let frame_id=Math.floor((ang_to_z-ball_class.HALF_FRAME_STEP)/ball_class.FRAME_STEP+1);;		
		
		if (ang_to_z>90){		
			shift_Z_rot=Math.PI;
			frame_id=ball_class.BALL_ANIM_FRAMES2m2-frame_id;
		}	

		this.strip.rotation=ang_rad+shift_Z_rot;	
		this.strip.texture=assets['ball_anim'+frame_id];
		
		
	}
	
	update_quat(){
				
		if (!this.speed) return;
		
		this.angular_speed=this.speed/ball_class.BALL_RADIUS;
		
		//обновляем (но по идее создаем новый кватернион по новому направлению) кватернион в зависимости от значений направления
		quat.update(this.quaternion,{x:-this.dir.y,y:this.dir.x,z:0},this.angular_speed);
		
	}
	
	recalc_speed(){
		
		//определяем скорость по длине вектора
		this.speed=r2(Math.sqrt(this.dir.x*this.dir.x+this.dir.y*this.dir.y));
		
	}
	
	stop(){
		
		this.dir.x=0;
		this.dir.y=0;
		this.speed=0;
		
	}
	
	slow_down(){
		
		if (!this.speed) return;
		
		//замедляем
		this.dir.x=r2(this.dir.x*ball_class.SLOW_DOWN);
		this.dir.y=r2(this.dir.y*ball_class.SLOW_DOWN);
		
		//пересчитываем скорость
		this.recalc_speed();
		
		//обновляем кватернион вращения (а именно скорость так как именно она поменялась)
		this.update_quat();
		
	}
	
	process_collision_to_board(){
		
		//ищем и запоминаем ближайшую точку от бордюров
		const nearest_to_line={x:999,y:999,d:999};
		this.nearest_point.d=9999999;
		const NUM_OF_BORDERS=6;
		for (let i=0;i<NUM_OF_BORDERS;i++){
			
			const border_box=borders[i*4+3];
			
			//делаем BB с маржином 10
			const x_min=border_box[0]-ball_class.BALL_RADIUS-10;
			const y_min=border_box[1]-ball_class.BALL_RADIUS-10;
			const x_max=border_box[2]+ball_class.BALL_RADIUS+10;
			const y_max=border_box[3]+ball_class.BALL_RADIUS+10;
			
			//не проверяем если линия слишком далеко
			if (this.x>x_max||this.y>y_max||this.x<x_min||this.y<y_min) continue;
			
			//итерация всех линий в бордере
			for (let l=0;l<3;l++){				
				const line_data=borders[i*4+l];
				this.get_nearest_to_line(nearest_to_line,line_data);
				if (nearest_to_line.d<this.nearest_point.d){
					this.nearest_point.x=nearest_to_line.x;
					this.nearest_point.y=nearest_to_line.y;
					this.nearest_point.d=nearest_to_line.d;
					this.nearest_point.l=l;
				}					
			}		
		}
		
		//теперь проверяем расстояние до нее
		this.nearest_point.d=Math.sqrt(this.nearest_point.d);
		
		const overlap=ball_class.BALL_RADIUS-this.nearest_point.d;
		
		//произошло столкновение
		if (overlap>0){
			
			sound.play('border_hit',0,this.speed*0.1);
			
			//отталкиваем на величину overlap
			const d_vec={x:this.x-this.nearest_point.x,y:this.y-this.nearest_point.y,z:0};
			quat.normalizeVector(d_vec);			
			this.x+=d_vec.x*overlap;
			this.y+=d_vec.y*overlap;
			
			this.x=r2(this.x);
			this.y=r2(this.y);
			
			this.reflect_direction();
			this.update_quat();
			
			if (this.nearest_point.l===1){
				this.borders_hits_before_potted++;
				sp_game.border_hit(this);					
			}
		
			//this.combo_cnt++;
			
		}		
		
	}
	
	set_color(color){
		
		this.bcg.tint=TINTS[color].bcg;
		this.strip.tint=TINTS[color].strip;
		this.color=color;
	}
	
	check_holes(){		
		
		if (!this.holes_check)return;
		
		for (let i=0;i<6;i++){
			
			const hole_data=holes[i];
			const dx=this.x-hole_data[0];
			const dy=this.y-hole_data[1];
			const d=Math.sqrt(dx*dx+dy*dy);
			if (d<20){
				this.set_hole_fall(hole_data);
				return;
			}			
		}			
	}
		
	async set_hole_fall(hole_data){
		
		this.on=0;
		this.speed=0;
		this.process=function(){};
		//common.ball_potted_event(this,hole_data);
		
		sound.play('ball_potted');
		
		await anim3.add(this,{alpha:[1,0,'linear'],x:[this.x,hole_data[0],'linear'],y:[this.y,hole_data[1],'linear']}, false, 0.25).then(()=>{
			online_game.ball_potted_event(this,hole_data);
			sp_game.ball_potted_event(this,hole_data);		
		})

		
	}
	
	restore(py,px){		
		this.x=px;
		this.y=py;
		this.on=1;
		this.alpha=1;
		this.visible=true;
		this.random_orientation();
		this.speed=0;
		this.process=this.move;		
	}
	
	add_to_stat(){
		
		anim3.add(this,{scale_xy:[0, this.scale_xy,'linear'],alpha:[0,1,'linear']}, true, 0.25,false);
		anim3.add(this.strip,{angle:[0, irnd(600,900),'easeOutCubic']}, true, 2,false);
		
	}
		
	move(){
		
		if (this.speed<0.3){			
			if (this.speed) this.stop();			
			return;
		} 
		
		//двигаем шар по направлению
		this.x=r2(this.x+this.dir.x);
		this.y=r2(this.y+this.dir.y);
		
		//вращаем вектор в соответствии с движением
		quat.rotate_vec_by_quat(this.z_vec,this.quaternion);
			
		//определяем ориентацию вектора Z в XY
		const ang_rad=Math.atan2(this.z_vec.y, this.z_vec.x)-Math.PI/2;

		//отклонение от Z чтобы вычислить наклон
		const ang_to_z=quat.angleToZ(this.z_vec);

		let shift_Z_rot=0;
		let frame_id=Math.floor((ang_to_z-ball_class.HALF_FRAME_STEP)/ball_class.FRAME_STEP+1);;		
		
		if (ang_to_z>90){		
			shift_Z_rot=Math.PI;
			frame_id=ball_class.BALL_ANIM_FRAMES2m2-frame_id;
		}	

		this.strip.rotation=ang_rad+shift_Z_rot;	
		this.strip.texture=assets['ball_anim'+frame_id];
				
		//проверка столкновений с границами доски		
		this.process_collision_to_board();	
		
		this.check_holes();		
	
	}	

}

class just_avatar_class extends PIXI.Container{
	
	constructor(size){
		
		super();
				
		this.shadow=new PIXI.Sprite(assets.avatar_shadow);
		this.shadow.width=this.shadow.height=size;
		
		this.avatar=new PIXI.Sprite();
		this.avatar.width=this.avatar.height=size-20;
		this.avatar.x=this.avatar.y=10;		
		
		this.frame=new PIXI.Sprite(assets.avatar_frame);
		this.frame.width=this.frame.height=size;

		this.avatar_mask=new PIXI.Sprite(assets.avatar_mask);
		this.avatar_mask.width=this.avatar_mask.height=size;
	
		this.avatar.mask=this.avatar_mask;
		
		
		this.addChild(this.shadow,this.avatar_mask,this.avatar,this.frame,this.avatar_mask,)
		
	}
	
}

class chat_record_class extends PIXI.Container {
	
	constructor() {
		
		super();
		
		this.tm=0;
		this.index=0;
		this.uid='';	

		
		this.avatar = new PIXI.Graphics();
		this.avatar.w=50;
		this.avatar.h=50;
		this.avatar.x=30;
		this.avatar.y=13;		
				
		this.avatar_bcg = new PIXI.Sprite(assets.chat_avatar_bcg_img);
		this.avatar_bcg.width=70;
		this.avatar_bcg.height=70;
		this.avatar_bcg.x=this.avatar.x-10;
		this.avatar_bcg.y=this.avatar.y-10;
		this.avatar_bcg.interactive=true;
		this.avatar_bcg.pointerdown=()=>chat.avatar_down(this);		
					
		this.avatar_frame = new PIXI.Sprite(assets.chat_avatar_frame_img);
		this.avatar_frame.width=70;
		this.avatar_frame.height=70;
		this.avatar_frame.x=this.avatar.x-10;
		this.avatar_frame.y=this.avatar.y-10;
		
		this.name = new PIXI.BitmapText('Имя Фамил', {fontName: 'mfont',fontSize: 17});
		this.name.anchor.set(0,0.5);
		this.name.x=this.avatar.x+72;
		this.name.y=this.avatar.y-1;	
		this.name.tint=0xFBE5D6;
		
		this.gif=new PIXI.Sprite();
		this.gif.x=this.avatar.x+65;	
		this.gif.y=22;
		
		this.gif_bcg=new PIXI.Graphics();
		this.gif_bcg.beginFill(0x111111)
		this.gif_bcg.drawRect(0,0,1,1);
		this.gif_bcg.x=this.gif.x+3;	
		this.gif_bcg.y=this.gif.y+3;
		this.gif_bcg.alpha=0.5;
		
		
				
		this.msg_bcg = new PIXI.NineSlicePlane(assets.msg_bcg,50,18,50,28);
		//this.msg_bcg.width=160;
		//this.msg_bcg.height=65;	
		this.msg_bcg.scale_xy=0.66666;		
		this.msg_bcg.x=this.avatar.x+45;	
		this.msg_bcg.y=this.avatar.y+2;
		
		this.msg = new PIXI.BitmapText('Имя Фамил', {fontName: 'mfont',fontSize: 19,lineSpacing:55,align: 'left'}); 
		this.msg.x=this.avatar.x+75;
		this.msg.y=this.avatar.y+30;
		this.msg.maxWidth=450;
		this.msg.anchor.set(0,0.5);
		this.msg.tint = 0xffffff;
		
		this.msg_tm = new PIXI.BitmapText('28.11.22 12:31', {fontName: 'mfont',fontSize: 15}); 		
		this.msg_tm.tint=0xffffff;
		this.msg_tm.alpha=0.6;
		this.msg_tm.anchor.set(1,0);
		
		this.visible = false;
		this.addChild(this.msg_bcg,this.gif_bcg,this.gif,this.avatar_bcg,this.avatar,this.avatar_frame,this.name,this.msg,this.msg_tm);
		
	}
		
	nameToColor(name) {
		  // Create a hash from the name
		  let hash = 0;
		  for (let i = 0; i < name.length; i++) {
			hash = name.charCodeAt(i) + ((hash << 5) - hash);
			hash = hash & hash; // Convert to 32bit integer
		  }

		  // Generate a color from the hash
		  let color = ((hash >> 24) & 0xFF).toString(16) +
					  ((hash >> 16) & 0xFF).toString(16) +
					  ((hash >> 8) & 0xFF).toString(16) +
					  (hash & 0xFF).toString(16);

		  // Ensure the color is 6 characters long
		  color = ('000000' + color).slice(-6);

		  // Convert the hex color to an RGB value
		  let r = parseInt(color.slice(0, 2), 16);
		  let g = parseInt(color.slice(2, 4), 16);
		  let b = parseInt(color.slice(4, 6), 16);

		  // Ensure the color is bright enough for a black background
		  // by normalizing the brightness.
		  if ((r * 0.299 + g * 0.587 + b * 0.114) < 128) {
			r = Math.min(r + 128, 255);
			g = Math.min(g + 128, 255);
			b = Math.min(b + 128, 255);
		  }

		  return (r << 16) + (g << 8) + b;
	}
		
	async update_avatar(uid, tar_sprite) {		
	
		//определяем pic_url
		await players_cache.update(uid);
		await players_cache.update_avatar(uid);
		tar_sprite.set_texture(players_cache.players[uid].texture);	
	}
	
	async set(msg_data) {
						
		//получаем pic_url из фб
		this.avatar.set_texture(PIXI.Texture.WHITE);
				
		await this.update_avatar(msg_data.uid, this.avatar);

		this.uid=msg_data.uid;
		this.tm = msg_data.tm;			
		this.index = msg_data.index;		
		
		this.name.set2(msg_data.name,150);
		this.name.tint=this.nameToColor(msg_data.name);
		//this.msg_tm.text = new Date(msg_data.tm).toLocaleString();
		this.msg.text=msg_data.msg;
		this.visible = true;
		
		if (msg_data.msg.startsWith('GIF')){			
			
			const mp4BaseT=await new Promise((resolve, reject)=>{
				const baseTexture = PIXI.BaseTexture.from('https://akukamil.github.io/common/gifs/'+msg_data.msg+'.mp4');
				if (baseTexture.width>1) resolve(baseTexture);
				baseTexture.on('loaded', () => resolve(baseTexture));
				baseTexture.on('error', (error) => resolve(null));
			});
			
			if (!mp4BaseT) {
				this.visible=false;
				return 0;
			}
			
			mp4BaseT.resource.source.play();
			mp4BaseT.resource.source.loop=true;
			
			this.gif.texture=PIXI.Texture.from(mp4BaseT);
			this.gif.visible=true;	
			const aspect_ratio=mp4BaseT.width/mp4BaseT.height;
			this.gif.height=90;
			this.gif.width=this.gif.height*aspect_ratio;
			this.msg_bcg.visible=false;
			this.msg.visible=false;
			this.msg_tm.anchor.set(0,0);
			this.msg_tm.y=this.gif.height+9;
			this.msg_tm.x=this.gif.width+102;
			
			this.gif_bcg.visible=true;
			this.gif_bcg.height=this.gif.height;
			this.gif_bcg.width=	this.gif.width;
			return this.gif.height+30;
			
		}else{
			
			this.gif_bcg.visible=false;
			this.gif.visible=false;	
			this.msg_bcg.visible=true;
			this.msg.visible=true;
			
			//бэкграунд сообщения в зависимости от длины
			const msg_bcg_width=Math.max(this.msg.width,100)+100;			
			this.msg_bcg.width=msg_bcg_width*1.5;				
					
			if (msg_bcg_width>300){
				this.msg_tm.anchor.set(1,0);
				this.msg_tm.y=this.avatar.y+52;
				this.msg_tm.x=msg_bcg_width+55;
			}else{
				this.msg_tm.anchor.set(0,0);
				this.msg_tm.y=this.avatar.y+37;
				this.msg_tm.x=msg_bcg_width+62;
			}	
			
			return 70;
		}		
	}		

}

class player_mini_card_class extends PIXI.Container {

	constructor(x,y,id) {
		super();
		this.visible=false;
		this.id=id;
		this.uid=0;
		this.type = 'single';
		this.x=x;
		this.y=y;
		
		
		this.bcg=new PIXI.Sprite(assets.mini_player_card);
		this.bcg.width=200;
		this.bcg.height=90;
		this.bcg.interactive=true;
		this.bcg.buttonMode=true;
		this.bcg.pointerdown=function(){lobby.card_down(id)};
		
		this.table_rating_hl=new PIXI.Sprite(assets.table_rating_hl);
		this.table_rating_hl.width=200;
		this.table_rating_hl.height=90;
		
		this.avatar=new PIXI.Graphics();
		this.avatar.x=16;
		this.avatar.y=16;
		this.avatar.w=this.avatar.h=58.2;
		
		this.avatar_frame=new PIXI.Sprite(assets.chat_avatar_frame_img);
		this.avatar_frame.x=16-11.64;
		this.avatar_frame.y=16-11.64;
		this.avatar_frame.width=this.avatar_frame.height=81.48;
				
		this.name="";
		this.name_text=new PIXI.BitmapText('', {fontName: 'mfont',fontSize: 22,align: 'center'});
		this.name_text.anchor.set(1,0);
		this.name_text.x=180;
		this.name_text.y=20;
		this.name_text.tint=0xffffff;		

		this.rating=0;
		this.rating_text=new PIXI.BitmapText('', {fontName: 'mfont',fontSize: 29,align: 'center'});
		this.rating_text.tint=0xffff00;
		this.rating_text.anchor.set(1,0.5);
		this.rating_text.x=185;
		this.rating_text.y=65;		
		this.rating_text.tint=0xffff55;

		//аватар первого игрока
		this.avatar1=new PIXI.Graphics();
		this.avatar1.x=19;
		this.avatar1.y=16;
		this.avatar1.w=this.avatar1.h=58.2;
		
		this.avatar1_frame=new PIXI.Sprite(assets.chat_avatar_frame_img);
		this.avatar1_frame.x=this.avatar1.x-11.64;
		this.avatar1_frame.y=this.avatar1.y-11.64;
		this.avatar1_frame.width=this.avatar1_frame.height=81.48;



		//аватар второго игрока
		this.avatar2=new PIXI.Graphics();
		this.avatar2.x=121;
		this.avatar2.y=16;
		this.avatar2.w=this.avatar2.h=58.2;
		
		this.avatar2_frame=new PIXI.Sprite(assets.chat_avatar_frame_img);
		this.avatar2_frame.x=this.avatar2.x-11.64;
		this.avatar2_frame.y=this.avatar2.y-11.64;
		this.avatar2_frame.width=this.avatar2_frame.height=81.48;
		
		
		this.rating_text1=new PIXI.BitmapText('', {fontName: 'mfont',fontSize: 24,align: 'center'});
		this.rating_text1.tint=0xffff00;
		this.rating_text1.anchor.set(0.5,0);
		this.rating_text1.x=48.1;
		this.rating_text1.y=56;

		this.rating_text2=new PIXI.BitmapText('', {fontName: 'mfont',fontSize: 24,align: 'center'});
		this.rating_text2.tint=0xffff00;
		this.rating_text2.anchor.set(0.5,0);
		this.rating_text2.x=150.1;
		this.rating_text2.y=56;		
		
		this.t_country=new PIXI.BitmapText('', {fontName: 'mfont',fontSize: 25,align: 'center'});
		this.t_country.tint=0xffff00;
		this.t_country.anchor.set(1,0.5);
		this.t_country.x=100;
		this.t_country.y=60;		
		this.t_country.tint=0xaaaa99;
		
		this.name1="";
		this.name2="";

		this.addChild(this.bcg,this.avatar,this.avatar_frame,this.avatar1, this.avatar1_frame, this.avatar2,this.avatar2_frame,this.rating_text,this.table_rating_hl,this.rating_text1,this.rating_text2, this.name_text,this.t_country);
	}

}

class feedback_record_class extends PIXI.Container {
	
	constructor() {
		
		super();		
		this.text=new PIXI.BitmapText('Николай: хорошая игра', {lineSpacing:50,fontName: 'mfont',fontSize: 20,align: 'left'}); 
		this.text.maxWidth=290;
		this.text.tint=0xFFFF00;
		
		this.name_text=new PIXI.BitmapText('Николай:', {fontName: 'mfont',fontSize: 20,align: 'left'}); 
		this.name_text.tint=0xFFFFFF;
		
		
		this.addChild(this.text,this.name_text)
	}		
	
	set(name, feedback_text){
		this.text.text=name+': '+feedback_text;
		this.name_text.text=name+':';
	
	}
	
	
}

class orb_anim_class extends PIXI.Container{
	
	constructor(){
		
		super();
		this.bcg0=new PIXI.Sprite(assets.orb0);
		this.bcg0.anchor.set(0.5,0.5);
		this.bcg0.visible=false;
		
		this.bcg1=new PIXI.Sprite(assets.orb2);
		this.bcg1.anchor.set(0.5,0.5);
		this.bcg1.visible=false;
		
		this.bcg2=new PIXI.Sprite(assets.orb1);
		this.bcg2.anchor.set(0.5,0.5);
		this.bcg2.visible=false;
		
		this.visible=false;
		
		this.addChild(this.bcg0,this.bcg1,this.bcg2);		
	}
	
	async activate(x,y){
		
		this.x=x;
		this.y=y;
		
		this.visible=true;
		anim3.add(this.bcg0,{scale_xy:[0.2, 1.15,'easeOutBack'],alpha:[1,0,'easeOutBack']}, true, 1.25,false);
		anim3.add(this.bcg1,{scale_xy:[0.2, 2,'easeOutBack'],alpha:[0.5,0,'easeOutBack'],angle:[0,15,'easeOutBack']}, true, 1.35,false);
		await anim3.wait(0.2);
		await anim3.add(this.bcg2,{scale_xy:[0.2, 1.5,'linear'],alpha:[0.5,0,'linear']}, true, 0.55,false);
		this.visible=false;
	}	
	
}

class level_icon_class extends PIXI.Container{
	
	constructor(){
		
		super();
		
		this.bcg=new PIXI.Sprite(assets.level_img);
		this.bcg.width=160;
		this.bcg.height=160;
		this.bcg.anchor.set(0.5,0.5)
				
		this.t=new PIXI.BitmapText('1', {fontName: 'mfont',fontSize: 50,align: 'left'}); 
		this.t.anchor.set(0.5,0.5);

		this.stars_icon=new PIXI.Sprite(assets.starsx2);
		this.stars_icon.anchor.set(0.5,0.5);
		this.stars_icon.y=55;
		
		this.addChild(this.bcg,this.t,this.stars_icon);
	}
		
}

req_dialog={

	_opp_data : {} ,
	
	async show(uid) {
		
		//если нет в кэше то загружаем из фб
		await players_cache.update(uid);
		await players_cache.update_avatar(uid);
		
		const player=players_cache.players[uid];
		
		sound.play('receive_sticker');	
		
		anim3.add(objects.req_cont,{y:[-260, objects.req_cont.sy,'easeOutElastic']}, true, 0.75);
							
		//Отображаем  имя и фамилию в окне приглашения
		req_dialog._opp_data.uid=uid;		
		req_dialog._opp_data.name=player.name;		
		req_dialog._opp_data.rating=player.rating;
				
		objects.req_name.set2(player.name,200);
		objects.req_rating.text=player.rating;
		
		objects.req_avatar.set_texture(player.texture);

	},

	reject() {

		if (objects.req_cont.ready===false || objects.req_cont.visible===false)
			return;
		
		sound.play('close_it');

		anim3.add(objects.req_cont,{y:[objects.req_cont.sy, -260,'easeInBack']}, false, 0.5);

		fbs.ref('inbox/'+req_dialog._opp_data.uid).set({sender:my_data.uid,message:"REJECT",tm:Date.now()});
	},

	accept() {

		if (anim3.any_on()||!objects.req_cont.visible) {
			sound.play('locked');
			return;			
		}
		
		//устанавливаем окончательные данные оппонента
		opp_data = req_dialog._opp_data;	
	
		anim3.add(objects.req_cont,{y:[objects.req_cont.sy, -260,'easeInBack']}, false, 0.5);
		
		
		//отправляем информацию о согласии играть с идентификатором игры и сидом
		game_id=irnd(1,9999);
		const seed = irnd(1,9999);
		fbs.ref('inbox/'+opp_data.uid).set({sender:my_data.uid,message:'ACCEPT',tm:Date.now(),game_id,seed});

		main_menu.close();
		lobby.close();
		online_game.activate(seed,1);

	},

	hide() {

		//если диалог не открыт то ничего не делаем
		if (objects.req_cont.ready === false || objects.req_cont.visible === false)
			return;

		anim3.add(objects.req_cont,{y:[objects.req_cont.sy, -260,'easeInBack']}, false, 0.5);

	}

}

chat={
	
	last_record_end : 0,
	drag : false,
	data:[],
	touch_y:0,
	drag_chat:false,
	drag_sx:0,
	drag_sy:-999,	
	recent_msg:[],
	moderation_mode:0,
	block_next_click:0,
	kill_next_click:0,
	delete_message_mode:0,
	games_to_chat:200,
	payments:0,
	processing:0,
	remote_socket:0,
	ss:[],
		
	activate() {	

		anim3.add(objects.chat_cont,{alpha:[0, 1,'linear']}, true, 0.1);
		//objects.bcg.texture=assets.lobby_bcg;
		objects.chat_enter_btn.visible=true;//my_data.games>=this.games_to_chat;
		
		if(my_data.blocked)		
			objects.chat_enter_btn.texture=assets.chat_blocked_img;
		else
			objects.chat_enter_btn.texture=assets.chat_enter_img;

		objects.chat_rules.text='Правила чата!\n1. Будьте вежливы: Общайтесь с другими игроками с уважением. Избегайте угроз, грубых выражений, оскорблений, конфликтов.\n2. Отправлять сообщения в чат могут игроки сыгравшие более 200 онлайн партий.\n3. За нарушение правил игрок может попасть в черный список.'
		if(my_data.blocked) objects.chat_rules.text='Вы не можете писать в чат, так как вы находитесь в черном списке';
		
		
	},
		
	new_message(data){
		
		console.log('new_data',data);
		
	},
	
	async init(){	
			
		this.last_record_end = 0;
		objects.chat_msg_cont.y = objects.chat_msg_cont.sy;		
		objects.bcg.interactive=true;
		objects.bcg.pointermove=this.pointer_move.bind(this);
		objects.bcg.pointerdown=this.pointer_down.bind(this);
		objects.bcg.pointerup=this.pointer_up.bind(this);
		objects.bcg.pointerupoutside=this.pointer_up.bind(this);
		
		for(let rec of objects.chat_records) {
			rec.visible = false;			
			rec.msg_id = -1;	
			rec.tm=0;
		}		
		
		this.init_yandex_payments();

		await my_ws.init();	
		
		//загружаем чат		
		const chat_data=await my_ws.get('chat',25);
		
		await this.chat_load(chat_data);
		
		//подписываемся на новые сообщения
		my_ws.ss_child_added('chat',chat.chat_updated.bind(chat))
		
		console.log('Чат загружен!')
	},		

	init_yandex_payments(){
				
		if (game_platform!=='YANDEX') return;			
				
		if(this.payments) return;
		
		ysdk.getPayments({ signed: true }).then(_payments => {
			chat.payments = _payments;
		}).catch(err => {})			
		
	},	

	get_oldest_index () {
		
		let oldest = {tm:9671801786406 ,visible:true};		
		for(let rec of objects.chat_records)
			if (rec.tm < oldest.tm)
				oldest = rec;	
		return oldest.index;		
		
	},
	
	get_oldest_or_free_msg () {
		
		//проверяем пустые записи чата
		for(let rec of objects.chat_records)
			if (!rec.visible)
				return rec;
		
		//если пустых нет то выбираем самое старое
		let oldest = {tm:9671801786406};		
		for(let rec of objects.chat_records)
			if (rec.visible===true && rec.tm < oldest.tm)
				oldest = rec;	
		return oldest;		
		
	},
		
	block_player(uid){
		
		fbs.ref('blocked/'+uid).set(Date.now());
		fbs.ref('inbox/'+uid).set({message:'CHAT_BLOCK',tm:Date.now()});
		
		//увеличиваем количество блокировок
		fbs.ref('players/'+uid+'/block_num').transaction(val=> {return (val || 0) + 1});
		
	},
		
	async chat_load(data) {
		
		if (!data) return;
		
		//превращаем в массив
		data = Object.keys(data).map((key) => data[key]);
		
		//сортируем сообщения от старых к новым
		data.sort(function(a, b) {	return a.tm - b.tm;});
			
		//покаываем несколько последних сообщений
		for (let c of data)
			await this.chat_updated(c,true);	
	},	
				
	async chat_updated(data, first_load) {		
	
		//console.log('chat_updated:',JSON.stringify(data).length);
		if(data===undefined||!data.msg||!data.name||!data.uid) return;
				
		//ждем пока процессинг пройдет
		for (let i=0;i<10;i++){			
			if (this.processing)
				await new Promise(resolve => setTimeout(resolve, 250));				
			else
				break;				
		}
		if (this.processing) return;
							
		this.processing=1;
		
		//выбираем номер сообщения
		const new_rec=this.get_oldest_or_free_msg();
		const y_shift=await new_rec.set(data);
		new_rec.y=this.last_record_end;
		
		this.last_record_end += y_shift;		

		if (!first_load)
			lobby.inst_message(data);
		
		//смещаем на одно сообщение (если чат не видим то без твина)
		if (objects.chat_cont.visible)
			await anim3.add(objects.chat_msg_cont,{y:[objects.chat_msg_cont.y,objects.chat_msg_cont.y-y_shift,'linear']},true, 0.05);		
		else
			objects.chat_msg_cont.y-=y_shift
		
		this.processing=0;
		
	},
						
	avatar_down(player_data){
		
		if (this.moderation_mode){
			console.log(player_data.index,player_data.uid,player_data.name.text,player_data.msg.text);
			fbs_once('players/'+player_data.uid+'/games').then((data)=>{
				console.log('сыграно игр: ',data)
			})
		}
		
		if (this.block_next_click){			
			this.block_player(player_data.uid);
			console.log('Игрок заблокирован: ',player_data.uid);
			this.block_next_click=0;
		}
		
		if (this.kill_next_click){			
			fbs.ref('inbox/'+player_data.uid).set({message:'CLIEND_ID',tm:Date.now(),client_id:999999});
			console.log('Игрок убит: ',player_data.uid);
			this.kill_next_click=0;
		}
		
		if(this.delete_message_mode){			
			fbs.ref(`${chat_path}/${player_data.index}`).remove();
			console.log(`сообщение ${player_data.index} удалено`)
		}
		
		
		if(this.moderation_mode||this.block_next_click||this.kill_next_click||this.delete_message_mode) return;
		
		if (objects.chat_keyboard_cont.visible)		
			keyboard.response_message(player_data.uid,player_data.name.text);
		else
			lobby.show_invite_dialog_from_chat(player_data.uid,player_data.name.text);
		
		
	},
			
	get_abs_top_bottom(){
		
		let top_y=999999;
		let bot_y=-999999
		for(let rec of objects.chat_records){
			if (rec.visible===true){
				const cur_abs_top=objects.chat_msg_cont.y+rec.y;
				const cur_abs_bot=objects.chat_msg_cont.y+rec.y+rec.height;
				if (cur_abs_top<top_y) top_y=cur_abs_top;
				if (cur_abs_bot>bot_y) bot_y=cur_abs_bot;
			}		
		}
		
		return [top_y,bot_y];				
		
	},
	
	back_btn_down(){
		
		if (anim3.any_on()===true) {
			sound.play('locked');
			return
		};
		
		sound.play('click');
		this.close();
		lobby.activate();
		
	},
	
	pointer_move(e){		
	
		if (!this.drag_chat) return;
		const mx = e.data.global.x/app.stage.scale.x;
		const my = e.data.global.y/app.stage.scale.y;
		
		const dy=my-this.drag_sy;		
		this.drag_sy=my;
		
		this.shift(dy);

	},
	
	pointer_down(e){
		
		const px=e.data.global.x/app.stage.scale.x;
		this.drag_sy=e.data.global.y/app.stage.scale.y;
		
		this.drag_chat=true;
		objects.chat_cont.by=objects.chat_cont.y;				

	},
	
	pointer_up(){
		
		this.drag_chat=false;
		
	},
	
	shift(dy) {				
		
		const [top_y,bot_y]=this.get_abs_top_bottom();
		
		//проверяем движение чата вверх
		if (dy<0){
			const new_bottom=bot_y+dy;
			const overlap=435-new_bottom;
			if (new_bottom<435) dy+=overlap;
		}
	
		//проверяем движение чата вниз
		if (dy>0){
			const new_top=top_y+dy;
			if (new_top>50)
				return;
		}
		
		objects.chat_msg_cont.y+=dy;
		
	},
		
	wheel_event(delta) {
		
		objects.chat_msg_cont.y-=delta*50;	
		const chat_bottom = this.last_record_end;
		const chat_top = this.last_record_end - objects.chat_records.filter(obj => obj.visible === true).length*70;
		
		if (objects.chat_msg_cont.y+chat_bottom<430)
			objects.chat_msg_cont.y = 430-chat_bottom;
		
		if (objects.chat_msg_cont.y+chat_top>0)
			objects.chat_msg_cont.y=-chat_top;
		
	},
	
	make_hash() {
	  let hash = '';
	  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	  for (let i = 0; i < 6; i++) {
		hash += characters.charAt(Math.floor(Math.random() * characters.length));
	  }
	  return hash;
	},
		
	async write_btn_down(){
		
		if (anim3.any_on()) {
			sound.play('locked');
			return
		};
				
		//оплата разблокировки чата
		if (my_data.blocked){	
		
			let block_num=await fbs_once('players/'+my_data.uid+'/block_num');
			block_num=block_num||1;
			block_num=Math.min(6,block_num);
		
			if(game_platform==='YANDEX'){
				
				this.payments.purchase({ id: 'unblock'+block_num}).then(purchase => {
					this.unblock_chat();
				}).catch(err => {
					message.add('Ошибка при покупке!');
				})				
			}
			
			if (game_platform==='VK') {
				
				vkBridge.send('VKWebAppShowOrderBox', { type: 'item', item: 'unblock'+block_num}).then(data =>{
					this.unblock_chat();
				}).catch((err) => {
					message.add('Ошибка при покупке!');
				});			
			
			};			
				
			return;
		}
				
		sound.play('click');
		
		//убираем метки старых сообщений
		const cur_dt=Date.now();
		this.recent_msg = this.recent_msg.filter(d =>cur_dt-d<60000);
				
		if (this.recent_msg.length>3){
			sys_msg.add('Подождите 1 минуту')
			return;
		}		
		
		//добавляем отметку о сообщении
		this.recent_msg.push(Date.now());
		
		//пишем сообщение в чат и отправляем его		
		const msg = await keyboard.read(70);		
		if (msg) {			
			const index=irnd(1,999);
			my_ws.safe_send({cmd:'push',path:'chat',val:{uid:my_data.uid,name:my_data.name,msg,tm:'TMS'}})	
			//fbs.ref(chat_path+'/'+index).set({uid:my_data.uid,name:my_data.name,msg, tm:firebase.database.ServerValue.TIMESTAMP,index});
		}	
		
	},
	
	unblock_chat(){
		objects.chat_rules.text='Правила чата!\n1. Будьте вежливы: Общайтесь с другими игроками с уважением. Избегайте угроз, грубых выражений, оскорблений, конфликтов.\n2. Отправлять сообщения в чат могут игроки сыгравшие более 200 онлайн партий.\n3. За нарушение правил игрок может попасть в черный список.'
		objects.chat_enter_btn.texture=assets.chat_enter_img;	
		fbs.ref('blocked/'+my_data.uid).remove();
		my_data.blocked=0;
		message.add('Вы разблокировали чат');
		sound.play('mini_dialog');	
	},
		
	close() {
		
		anim3.add(objects.chat_cont,{alpha:[1, 0,'linear']}, false, 0.1);
		if (objects.chat_keyboard_cont.visible)
			keyboard.close();
	}
		
}

sound={	
	
	on : 1,
	
	play(snd_res,is_loop,volume) {
		
		if (!this.on||document.hidden)
			return;
		
		if (!assets[snd_res])
			return;
		
		assets[snd_res].play({loop:is_loop||false,volume:volume||1});	
		
	},
	
}

music={
	
	on:1	
	
}

process_new_message = function(msg) {

	//проверяем плохие сообщения
	if (msg===null || msg===undefined)
		return;

	//принимаем только положительный ответ от соответствующего соперника и начинаем игру
	if (msg.message==='ACCEPT'  && pending_player===msg.sender && state !== "p") {
		//в данном случае я мастер и хожу вторым
		opp_data.uid=msg.sender;
		game_id=msg.game_id;
		lobby.accepted_invite(msg.seed);
	}

	//принимаем также отрицательный ответ от соответствующего соперника
	if (msg.message==='REJECT'  && pending_player === msg.sender) {
		lobby.rejected_invite();
	}

	//айди клиента для удаления дубликатов
	if (msg.message==='CLIEND_ID') 
		if (msg.client_id !== client_id)
			kill_game();


	//получение сообщение в состояни игры
	if (state==='p') {

		//учитываем только сообщения от соперника
		if (msg.sender===opp_data.uid) {

			//получение отказа от игры
			if (msg.message==='REFUSE')
				confirm_dialog.opponent_confirm_play(0);

			//получение согласия на игру
			if (msg.message==='CONF')
				confirm_dialog.opponent_confirm_play(1);

			//получение стикера
			if (msg.message==='MSG')
				stickers.receive(msg.data);
			
			//подтверждение начала игры
			if (msg.message==='CONF_START')
				online_game.opp_conf_play=1;

			//получение сообщение с сдаче
			if (msg.message==='END')
				online_game.finish_event('opp_giveup');

			//получение сообщение с ходом игорка
			if (msg.message==='MOVE')
				common.process_incoming_move(msg.data);
			
			//получение сообщение с ходом игорка
			if (msg.message==='RESUME')
				opponent.conf_resume=1;
			
			//получение сообщение с ходом игорка
			if (msg.message==='CHAT')
				online_game.chat(msg.data);
			
			//соперник отключил чат
			if (msg.message==='NOCHAT')
				online_game.nochat();
		}
	}

	//приглашение поиграть
	if(state==='o'||state==='b') {
		
		if (msg.message==='INV') {
			req_dialog.show(msg.sender);
		}
		
		if (msg.message==='INV_REM') {
			//запрос игры обновляет данные оппонента поэтому отказ обрабатываем только от актуального запроса
			if (msg.sender === req_dialog._opp_data.uid)
				req_dialog.hide(msg.sender);
		}
		
	}

}

message =  {
	
	promise_resolve :0,
	
	async add(data={text:'---', timeout:3000,sound_name:'online_message',sender:'me'}) {
		
		if (this.promise_resolve!==0) this.promise_resolve('forced');		
		
		//воспроизводим звук
		sound.play(data.sound_name);

		objects.message_text.text=data.text;
		
		
		if (data.sender==='me'){			
			objects.message_cont.x=90;
			objects.message_bcg.scale_x=-0.66666;			
		}else{
			
			objects.message_cont.x=430;
			objects.message_bcg.scale_x=0.666666;
			
		}		

		await anim3.add(objects.message_cont,{alpha:[0,1,'linear']}, true, 0.25,false);

		const res = await new Promise((resolve, reject) => {
				message.promise_resolve = resolve;
				setTimeout(resolve, data.timeout)
			}
		);
		
		//это если насильно закрываем
		if (res==='forced') return;

		anim3.add(objects.message_cont,{alpha:[1, 0,'linear']}, false, 0.25,false);			
	},
	
	clicked() {
		
		
		message.promise_resolve();
		
	}

}

sys_msg={
	
	promise_resolve :0,
	
	async add(t){
		
		if (this.promise_resolve) this.promise_resolve('forced');
		
		sound.play('popup');
		
		//показываем сообщение
		objects.t_sys_msg.text=t;
		const ares=await anim3.add(objects.sys_msg_cont,{y:[-50,-20,'linear']}, true, 0.25,false);	
		if (ares==='killed') return;
		
		//ждем
		const res = await new Promise(resolve => {
				sys_msg.promise_resolve = resolve;
				setTimeout(resolve,5000)
			}
		);
		
		//это если насильно закрываем
		if (res==='forced') return;
		
		anim3.add(objects.sys_msg_cont,{y:[-20,-50,'linear']}, false, 0.25,false);	
		
	}
	
}

stickers={
	
	promise_resolve_send :0,
	promise_resolve_recive :0,

	show_panel() {

		if (anim3.any_on()||objects.stickers_cont.visible) {
			sound.play('locked');
			return
		};

		if (!objects.stickers_cont.ready) return;
		sound.play('click');

		//ничего не делаем если панель еще не готова
		if (!objects.stickers_cont.ready||objects.stickers_cont.visible||state!=='p') return;

		//анимационное появление панели стикеров
		anim3.add(objects.stickers_cont,{y:[450, objects.stickers_cont.sy,'easeOutBack']}, true, 0.5);

	},

	hide_panel() {

		sound.play('close');

		if (objects.stickers_cont.ready===false)
			return;

		//анимационное появление панели стикеров
		anim3.add(objects.stickers_cont,{y:[objects.stickers_cont.sy, -450,'easeInBack']}, false, 0.5);

	},

	async send(id) {

		if (objects.stickers_cont.ready===false)
			return;
		
		if (this.promise_resolve_send!==0)
			this.promise_resolve_send("forced");

		this.hide_panel();

		fbs.ref('inbox/'+opp_data.uid).set({sender:my_data.uid,message:"MSG",tm:Date.now(),data:id});
		common.show_info(["Стикер отправлен сопернику","Sticker was sent"][LANG]);

	},

	async receive(id) {

		
		if (this.promise_resolve_recive!==0)
			this.promise_resolve_recive('forced');

		//воспроизводим соответствующий звук
		sound.play('receive_sticker');

		objects.rec_sticker_area.texture=assets['sticker_texture_'+id];
	
		await anim3.add(objects.rec_sticker_area,{x:[-150, objects.rec_sticker_area.sx,'easeOutBack']}, true, 0.5);

		let res = await new Promise((resolve, reject) => {
				stickers.promise_resolve_recive = resolve;
				setTimeout(resolve, 5000)
			}
		);
		
		if (res === "forced")
			return;

		anim3.add(objects.rec_sticker_area,{x:[objects.rec_sticker_area.sx, -150,'easeInBack']}, false, 0.5);

	}

}

fin_dialog={
	
	resolver:0,
	
	show(result){
		
		anim3.add(objects.fin_dlg_cont,{y:[objects.fin_dlg_cont.sy+30,objects.fin_dlg_cont.sy,'linear'],alpha:[0,1,'linear']},true, 0.3);	
		
		const res_data={
			me_black_potted:{type:LOSE,t2:['Вы забили черный шар! Этого нельзя сейчас делать!','You potted black ball in wrong time!'][LANG]},
			opp_black_potted:{type:WIN,t2:['Соперник забил черный шар! Этого нельзя делать сейчас!','Opponent potted black ball in wrong time!'][LANG]},
			me_black_potted_wrong:{type:LOSE,t2:['Вы забили черный шар, но начали с чужого!',"You lost! You potted the black ball but started with an opponent's ball!"][LANG]},
			opp_black_potted_wrong:{type:WIN,t2:['Соперник забил черный шар, но начал с чужого!','You win! Opponent potted black ball but started with wrong ball'][LANG]},
			me_win:{type:WIN,t2:['Вы забили все шары своей группы и черный шар по всем правилам!',"You potted all your group’s balls and the black ball by the rules!"][LANG]},
			opp_win:{type:LOSE,t2:['Соперник забил все шары своей группы и черный шар по всем правилам!',"Your opponent potted all their group’s balls and the black ball by the rules!"][LANG]},
			my_no_connection:{type:LOSE,t2:['Пропала интернет связь!','Connection is lost!'][LANG]},
			my_timeout:{type:LOSE,t2:['У вас закончилось время на ход!','You have run out of time'][LANG]},
			opp_timeout:{type:WIN,t2:['У соперника закончилось время на ход!','The opponent has run out of time to move!'][LANG]},
			timer_error:{type:LOSE,t2:['Ошибка таймера!','Timer error!'][LANG]},
			my_giveup:{type:LOSE,t2:['Вы сдались!','You gave up!'][LANG]},
			opp_giveup:{type:WIN,t2:['Соперник сдался!','The opponent has surrendered!'][LANG]},
			no_opp_conf:{type:NOSYNC,t2:['Похоже соперник не смог начать игру!',"Looks like the opponent couldn't start the game!"][LANG]},
		}[result];
		
		
		//главные заголовок
		const t1={'1':['Победа!','You won!'][LANG],'-1':['Поражение!','You lost!'][LANG],'2':'---!'}[res_data.type];
		
		
		
		//определяем новый рейтинг
		const old_rating=my_data.rating;
		if (res_data.type===WIN) my_data.rating=my_data.win_rating;		
		if (res_data.type===LOSE) my_data.rating=my_data.lose_rating;
		if (res_data.type===DRAW) my_data.rating=my_data.draw_rating;
		
		
		//если выиграли в онлайн игре
		if (opponent===online_game){
			my_data.games++;
			fbs.ref('players/'+my_data.uid+'/rating').set(my_data.rating);
			fbs.ref('players/'+my_data.uid+'/games').set(my_data.games);		
		}
		
		let tar_x=0;
		switch(res_data.type){
			
			case WIN:
				objects.fin_dlg_crown.visible=true;
				objects.fin_dlg_orb1.visible=true;
				objects.fin_dlg_orb2visiblex=true;
				tar_x=objects.fin_dlg_avatar1.x+objects.fin_dlg_avatar1.w*0.5;
				objects.fin_dlg_crown.x=tar_x;
				objects.fin_dlg_orb1.x=tar_x;
				objects.fin_dlg_orb2.x=tar_x;
				sound.play('win2');
			break;
			
			case LOSE:
				objects.fin_dlg_crown.visible=true;
				objects.fin_dlg_orb1.visible=true;
				objects.fin_dlg_orb2visiblex=true;
				tar_x=objects.fin_dlg_avatar2.x+objects.fin_dlg_avatar2.w*0.5;
				objects.fin_dlg_crown.x=tar_x;
				objects.fin_dlg_orb1.x=tar_x;
				objects.fin_dlg_orb2.x=tar_x;		
				sound.play('lose');
			break;
			
			default:
				objects.fin_dlg_crown.visible=false;
				objects.fin_dlg_orb1.visible=false;
				objects.fin_dlg_orb2visiblex=false;
				sound.play('lose');
			break;
			
		}
		
		
		//заполняем имя
		objects.fin_dlg_name1.text=my_data.name;
		objects.fin_dlg_name2.text=opp_data.name;

		objects.fin_dlg_avatar1.set_texture(players_cache.players[my_data.uid].texture);
		objects.fin_dlg_avatar2.set_texture(players_cache.players[opp_data.uid].texture);
		
		//заполняем данные с результатами игры
		objects.fin_dlg_title1.text=t1;
		objects.fin_dlg_title2.text=res_data.t2;
		
		objects.fin_dlg_rating1.text=old_rating+' >>> '+my_data.rating;
		objects.fin_dlg_rating2.text=old_rating+' >>> '+my_data.rating;
		
		some_process.fin_dlg_anim=function(){fin_dialog.winner_anim()};
		
		return new Promise(res=>{fin_dialog.resolver=res});
		
	},
	
	close(){
		
		some_process.fin_dlg_anim=function(){};
		objects.fin_dlg_cont.visible=false;
		this.resolver();
		
	},
	
	fb_down(){
		
		this.close();
		
	},
	
	ok_down(){
		
		this.close();	
				
	},
	
	winner_anim(){
		const p=1;
		objects.fin_dlg_orb1.alpha=Math.abs(Math.sin(game_tick));
		objects.fin_dlg_orb2.alpha=Math.abs(Math.cos(game_tick));
		
		//objects.fin_dlg_orb1.rotation+=0.01;
		//objects.fin_dlg_orb2.rotation+=0.02;
		if (objects.fin_dlg_orb1.alpha<0.02) {
			objects.fin_dlg_orb1.angle=irnd(0,360);
			objects.fin_dlg_orb1.tint=(Math.random()*0.1+0.9)*0xffffff;
		}
		if (objects.fin_dlg_orb2.alpha<0.02){
			objects.fin_dlg_orb2.angle=irnd(0,360);
			objects.fin_dlg_orb2.tint=(Math.random()*0.1+0.9)*0xffffff;
		}

	}
}

function resize() {
    const vpw = window.innerWidth;  // Width of the viewport
    const vph = window.innerHeight; // Height of the viewport
    let nvw; // New game width
    let nvh; // New game height

    if (vph / vpw < M_HEIGHT / M_WIDTH) {
      nvh = vph;
      nvw = (nvh * M_WIDTH) / M_HEIGHT;
    } else {
      nvw = vpw;
      nvh = (nvw * M_HEIGHT) / M_WIDTH;
    }
    app.renderer.resize(nvw, nvh);
    app.stage.scale.set(nvw / M_WIDTH, nvh / M_HEIGHT);
}

function set_state(params) {

	if (params.state!==undefined)
		state=params.state;

	if (params.hidden!==undefined)
		hidden=+params.hidden;

	let small_opp_id="";
	if (opp_data.uid!==undefined)
		small_opp_id=opp_data.uid.substring(0,10);

	fbs.ref(room_name+'/'+my_data.uid).set({state:state, name:my_data.name, rating : my_data.rating, hidden, opp_id : small_opp_id, game_id});

}

confirm_dialog = {
	
	p_resolve : 0,
		
	show(msg) {
								
		if (objects.confirm_cont.visible === true) {
			sound.play('locked')
			return;			
		}		
		
		sound.play("confirm_dialog");
				
		objects.confirm_msg.text=msg;
		
		anim3.add(objects.confirm_cont,{y:[450,objects.confirm_cont.sy,'easeOutBack']}, true, 0.6);		
				
		return new Promise(function(resolve, reject){					
			confirm_dialog.p_resolve = resolve;	  		  
		});
	},
	
	button_down(res) {
		
		if (anim3.any_on()===true) {
			sound.play('locked');
			return
		};	
		
		sound.play('click')

		this.close();
		this.p_resolve(res);	
		
	},
	
	close () {
		
		anim3.add(objects.confirm_cont,{y:[objects.confirm_cont.sy,450,'easeInBack']}, false, 0.4);		
		
	}

}

keyboard={
	
	ru_keys:[[54.38,100,88.52,139.24,'1'],[99.9,100,134.04,139.24,'2'],[145.41,100,179.55,139.24,'3'],[190.93,100,225.07,139.24,'4'],[236.45,100,270.59,139.24,'5'],[281.97,100,316.11,139.24,'6'],[327.48,100,361.62,139.24,'7'],[373,100,407.14,139.24,'8'],[418.52,100,452.66,139.24,'9'],[464.03,100,498.17,139.24,'0'],[556.21,100,613.11,139.24,'<'],[77.14,149.05,111.28,188.29,'Й'],[122.66,149.05,156.8,188.29,'Ц'],[168.17,149.05,202.31,188.29,'У'],[213.69,149.05,247.83,188.29,'К'],[259.21,149.05,293.35,188.29,'Е'],[304.72,149.05,338.86,188.29,'Н'],[350.24,149.05,384.38,188.29,'Г'],[395.76,149.05,429.9,188.29,'Ш'],[441.28,149.05,475.42,188.29,'Щ'],[486.79,149.05,520.93,188.29,'З'],[532.31,149.05,566.45,188.29,'Х'],[577.83,149.05,611.97,188.29,'Ъ'],[99.9,198.09,134.04,237.33,'Ф'],[145.41,198.09,179.55,237.33,'Ы'],[190.93,198.09,225.07,237.33,'В'],[236.45,198.09,270.59,237.33,'А'],[281.97,198.09,316.11,237.33,'П'],[327.48,198.09,361.62,237.33,'Р'],[373,198.09,407.14,237.33,'О'],[418.52,198.09,452.66,237.33,'Л'],[464.03,198.09,498.17,237.33,'Д'],[509.55,198.09,543.69,237.33,'Ж'],[555.07,198.09,589.21,237.33,'Э'],[77.14,247.14,111.28,286.38,'!'],[122.66,247.14,156.8,286.38,'Я'],[168.17,247.14,202.31,286.38,'Ч'],[213.69,247.14,247.83,286.38,'С'],[259.21,247.14,293.35,286.38,'М'],[304.72,247.14,338.86,286.38,'И'],[350.24,247.14,384.38,286.38,'Т'],[395.76,247.14,429.9,286.38,'Ь'],[441.28,247.14,475.42,286.38,'Б'],[486.79,247.14,520.93,286.38,'Ю'],[578.97,247.14,613.11,286.38,')'],[510.69,100,544.83,139.24,'?'],[31.62,296.18,202.31,346,'ЗАКРЫТЬ'],[213.69,296.18,475.41,346,' '],[486.79,296.18,646.1,346,'ОТПРАВИТЬ'],[601.72,198.09,635.86,237.33,','],[533.45,247.14,567.59,286.38,'('],[31.62,198.09,88.52,237.33,'EN']],
	en_keys:[[56.65,100,90.78,139.08,'1'],[102.15,100,136.28,139.08,'2'],[147.66,100,181.79,139.08,'3'],[193.17,100,227.3,139.08,'4'],[238.68,100,272.81,139.08,'5'],[284.18,100,318.31,139.08,'6'],[329.69,100,363.82,139.08,'7'],[375.2,100,409.33,139.08,'8'],[420.71,100,454.84,139.08,'9'],[466.22,100,500.35,139.08,'0'],[558.37,100,615.25,139.08,'<'],[124.91,148.85,159.04,187.93,'Q'],[170.41,148.85,204.54,187.93,'W'],[215.92,148.85,250.05,187.93,'E'],[261.43,148.85,295.56,187.93,'R'],[306.94,148.85,341.07,187.93,'T'],[352.45,148.85,386.58,187.93,'Y'],[397.95,148.85,432.08,187.93,'U'],[443.46,148.85,477.59,187.93,'I'],[488.97,148.85,523.1,187.93,'O'],[534.48,148.85,568.61,187.93,'P'],[147.66,197.69,181.79,236.77,'A'],[193.17,197.69,227.3,236.77,'S'],[238.68,197.69,272.81,236.77,'D'],[284.18,197.69,318.31,236.77,'F'],[329.69,197.69,363.82,236.77,'G'],[375.2,197.69,409.33,236.77,'H'],[420.71,197.69,454.84,236.77,'J'],[466.22,197.69,500.35,236.77,'K'],[511.72,197.69,545.85,236.77,'L'],[535.61,246.54,569.74,285.62,'('],[79.4,246.54,113.53,285.62,'!'],[170.41,246.54,204.54,285.62,'Z'],[215.92,246.54,250.05,285.62,'X'],[261.43,246.54,295.56,285.62,'C'],[306.94,246.54,341.07,285.62,'V'],[352.45,246.54,386.58,285.62,'B'],[397.95,246.54,432.08,285.62,'N'],[443.46,246.54,477.59,285.62,'M'],[581.12,246.54,615.25,285.62,')'],[512.86,100,546.99,139.08,'?'],[33.89,295.39,204.54,346,'CLOSE'],[215.92,295.39,477.59,346,' '],[488.97,295.39,648.25,346,'SEND'],[603.88,197.69,638.01,236.77,','],[33.89,197.69,90.77,236.77,'RU']],
	layout:0,
	resolver:0,
	
	MAX_SYMBOLS : 60,
	
	read(max_symb){
		
		this.MAX_SYMBOLS=max_symb||60;
		if (!this.layout)this.switch_layout();	
		
		//если какой-то ресолвер открыт
		if(this.resolver) {
			this.resolver('');
			this.resolver=0;
		}
		
		objects.chat_keyboard_text.text ='';
		objects.chat_keyboard_control.text = `0/${this.MAX_SYMBOLS}`
				
		anim3.add(objects.chat_keyboard_cont,{y:[450, objects.chat_keyboard_cont.sy,'linear']}, true, 0.2);	


		return new Promise(resolve=>{			
			this.resolver=resolve;			
		})
		
	},
	
	keydown (key) {		
		
		//*******это нажатие с клавиатуры
		if(!objects.chat_keyboard_cont.visible) return;	
		
		key = key.toUpperCase();
		
		if(key==='BACKSPACE') key ='<';
		if(key==='ENTER') key ='ОТПРАВИТЬ';
		if(key==='ESCAPE') key ='ЗАКРЫТЬ';
		
		var key2 = this.layout.find(k => {return k[4] === key})			
				
		this.process_key(key2)		
		
	},
	
	get_key_from_touch(e){
		
		//координаты нажатия в плостоки спрайта клавиатуры
		let mx = e.data.global.x/app.stage.scale.x - objects.chat_keyboard_cont.x-10;
		let my = e.data.global.y/app.stage.scale.y - objects.chat_keyboard_cont.y-10;
		
		//ищем попадание нажатия на кнопку
		let margin = 5;
		for (let k of this.layout)	
			if (mx > k[0] - margin && mx <k[2] + margin  && my > k[1] - margin && my < k[3] + margin)
				return k;
		return null;		
	},
	
	highlight_key(key_data){
		
		const [x,y,x2,y2,key]=key_data
		
		//подсвечиваем клавишу
		objects.chat_keyboard_hl.width=x2-x+20;
		objects.chat_keyboard_hl.height=y2-y+20;
		
		objects.chat_keyboard_hl.x = x+objects.chat_keyboard.x-10;
		objects.chat_keyboard_hl.y = y+objects.chat_keyboard.y-10;	
		
		anim3.add(objects.chat_keyboard_hl,{alpha:[1, 0,'linear']}, false, 0.5);
		
	},	
	
	pointerdown (e) {
		
		//if (!game.on) return;
				
		//получаем значение на которое нажали
		const key=this.get_key_from_touch(e);
		
		//дальнейшая обработка нажатой команды
		this.process_key(key);	
	},
	
	response_message(uid, name) {
		
		objects.chat_keyboard_text.text = name.split(' ')[0]+', ';	
		objects.chat_keyboard_control.text = `${objects.chat_keyboard_text.text.length}/${keyboard.MAX_SYMBOLS}`		
		
	},
	
	switch_layout(){
		
		if (this.layout===this.ru_keys){			
			this.layout=this.en_keys;
			objects.chat_keyboard.texture=assets.eng_layout;
		}else{			
			this.layout=this.ru_keys;
			objects.chat_keyboard.texture=assets.rus_layout;
		}
		
	},
	
	process_key(key_data){

		if(!key_data) return;	

		let key=key_data[4];	

		//звук нажатой клавиши
		sound.play('keypress');				
		
		const t=objects.chat_keyboard_text.text;
		if ((key==='ОТПРАВИТЬ'||key==='SEND')&&t.length>0){
			this.resolver(t);
			this.resolver=0;
			this.close();
			key ='';		
		}

		if (key==='ЗАКРЫТЬ'||key==='CLOSE'){
			this.resolver(0);			
			this.close();
			key ='';		
		}
		
		if (key==='RU'||key==='EN'){
			this.switch_layout();
			key ='';		
		}
		
		if (key==='<'){
			objects.chat_keyboard_text.text=t.slice(0, -1);
			key ='';		
		}
		
		if (t.length>=this.MAX_SYMBOLS) return;
		
		//подсвечиваем...
		this.highlight_key(key_data);			

		//добавляем значение к слову
		if (key.length===1) objects.chat_keyboard_text.text+=key;
		
		objects.chat_keyboard_control.text = `${objects.chat_keyboard_text.text.length}/${this.MAX_SYMBOLS}`		
		
	},
	
	close () {		
		
		//на всякий случай уничтожаем резолвер
		if (this.resolver) this.resolver(0);
		anim3.add(objects.chat_keyboard_cont,{y:[objects.chat_keyboard_cont.y,450,'linear']}, false, 0.2);		
		
	},
	
}

auth2={
		
	load_script(src) {
	  return new Promise((resolve, reject) => {
		const script = document.createElement('script')
		script.type = 'text/javascript'
		script.onload = resolve
		script.onerror = reject
		script.src = src
		document.head.appendChild(script)
	  })
	},
			
	get_random_char() {		
		
		const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
		return chars[irnd(0,chars.length-1)];
		
	},
	
	get_random_uid_for_local (prefix) {
		
		let uid = prefix;
		for ( let c = 0 ; c < 12 ; c++ )
			uid += this.get_random_char();
		
		//сохраняем этот uid в локальном хранилище
		try {
			localStorage.setItem('poker_uid', uid);
		} catch (e) {alert(e)}
					
		return uid;
		
	},
	
	get_random_name (uid) {
		
		const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
		const rnd_names = ['Gamma','Chime','Dron','Perl','Onyx','Asti','Wolf','Roll','Lime','Cosy','Hot','Kent','Pony','Baker','Super','ZigZag','Magik','Alpha','Beta','Foxy','Fazer','King','Kid','Rock'];
		
		if (uid !== undefined) {
			
			let e_num1 = chars.indexOf(uid[3]) + chars.indexOf(uid[4]) + chars.indexOf(uid[5]) + chars.indexOf(uid[6]);
			e_num1 = Math.abs(e_num1) % (rnd_names.length - 1);				
			let name_postfix = chars.indexOf(uid[7]).toString() + chars.indexOf(uid[8]).toString() + chars.indexOf(uid[9]).toString() ;	
			return rnd_names[e_num1] + name_postfix.substring(0, 3);					
			
		} else {

			let rnd_num = irnd(0, rnd_names.length - 1);
			let rand_uid = irnd(0, 999999)+ 100;
			let name_postfix = rand_uid.toString().substring(0, 3);
			let name =	rnd_names[rnd_num] + name_postfix;				
			return name;
		}	
	},	
	
	async get_country_code() {

		let country_code = ''
		try {
			let resp1 = await fetch("https://ipinfo.io/json?token=63f43de65702b8");
			let resp2 = await resp1.json();			
			country_code = resp2.country || '';			
		} catch(e){}

		return country_code;
		
	},
	
	async get_country_code2() {

		let country_code = ''
		try {
			let resp1 = await fetch("https://api.ipgeolocation.io/ipgeo?apiKey=1efc1ba695434f2ab24129a98a72a1d4");
			let resp2 = await resp1.json();			
			country_code = resp2.country_code2 || '';			
		} catch(e){}

		return country_code;
		
	},
	
	search_in_local_storage () {
		
		//ищем в локальном хранилище
		let local_uid = null;
		
		try {
			local_uid = localStorage.getItem('poker_uid');
		} catch (e) {alert(e)}
				
		if (local_uid !== null) return local_uid;
		
		return undefined;	
		
	},
	
	async init() {	
				
		if (game_platform === 'YANDEX') {			
		
			try {await this.load_script('https://yandex.ru/games/sdk/v2')} catch (e) {alert(e)};										
					
			let _player;
			
			try {
				window.ysdk = await YaGames.init({});			
				_player = await window.ysdk.getPlayer();
			} catch (e) { alert(e)};
			
			my_data.uid = _player.getUniqueID().replace(/[\/+=]/g, '');
			my_data.name = _player.getName();
			my_data.orig_pic_url = _player.getPhoto('medium');
			
			if (my_data.orig_pic_url === 'https://games-sdk.yandex.ru/games/api/sdk/v1/player/avatar/0/islands-retina-medium')
				my_data.orig_pic_url = 'mavatar'+my_data.uid;	
			
			if (my_data.name === '')
				my_data.name = this.get_random_name(my_data.uid);
				
			//загружаем покупки
			ysdk.getPayments({ signed: true }).then(_payments => {
				yndx_payments = _payments;		
			}).catch(err => {
				alert('Ошибка при загрузке покупок!')
			})	
				
			return;
		}
		
		if (game_platform === 'VK') {
			
			try {							
				await this.load_script('https://unpkg.com/@vkontakte/vk-bridge/dist/browser.min.js')||await this.load_script('https://akukamil.github.io/common/vkbridge.js');
			} catch (e) {alert(e)};
			
			let _player;
			
			try {
				await vkBridge.send('VKWebAppInit');
				_player = await vkBridge.send('VKWebAppGetUserInfo');				
			} catch (e) {alert(e)};

			
			my_data.name 	= _player.first_name + ' ' + _player.last_name;
			my_data.uid 	= 'vk'+_player.id;
			my_data.orig_pic_url = _player.photo_100;
			
			return;
			
		}
		
		if (game_platform === 'GOOGLE_PLAY') {	

			my_data.uid = this.search_in_local_storage() || this.get_random_uid_for_local('GP_');
			my_data.name = this.get_random_name(my_data.uid);
			my_data.orig_pic_url = 'mavatar'+my_data.uid;		
			return;
		}
		
		if (game_platform === 'DEBUG') {		

			my_data.name = my_data.uid = 'debug' + prompt('Отладка. Введите ID', 100);
			my_data.orig_pic_url = 'mavatar'+my_data.uid;		
			return;
		}	
		
		if (game_platform === 'UNKNOWN') {
			
			//если не нашли платформу
			//alert('Неизвестная платформа. Кто Вы?')
			my_data.uid = this.search_in_local_storage() || this.get_random_uid_for_local('LS_');
			my_data.name = this.get_random_name(my_data.uid);
			my_data.orig_pic_url = 'mavatar'+my_data.uid;		
		}
	},
	
	get_country_from_name(name){
		
		const have_country_code=/\(.{2}\)/.test(name);
		if(have_country_code)
			return name.slice(-3, -1);
		return '';
		
	}

}

timer={
	
	on:0,
	time_for_move:30,
	move_time_start:0,
	prv_time:0,
	cur_bar:0,
	
	start(turn_on){				
		//return
		//включаем и проверяем
		if (turn_on) this.on=1;
		if (!this.on) return
			
		//сам таймер
		some_process.time=function(){timer.tick()};
				
		//время когда пошел отсчет хода
		this.prv_time=this.move_time_start=Date.now();
							
		this.disconnect_time=0;
		
		//положение таймера
		if (my_turn){
			objects.my_timer_bar.width=210;
			objects.my_timer_bar.visible=true;
			objects.opp_timer_bar.visible=false;
			this.cur_bar=objects.my_timer_bar;
		} else {
			objects.opp_timer_bar.width=210;
			objects.my_timer_bar.visible=false;
			objects.opp_timer_bar.visible=true;
			this.cur_bar=objects.opp_timer_bar;
		}
		
	},
	
	stop(){
		
		//сам таймер
		some_process.time=function(){};
		
	},
	
	tick(){
		
		//проверка таймера
		const cur_time=Date.now();
		//console.log(cur_time-this.prv_time);
		if (cur_time-this.prv_time>5000||cur_time<this.prv_time){
			
			//online_game.finish_event('timer_error');
			//return;
		}
		this.prv_time=cur_time;
		
		//проверка соединения
		if (!connected) {
			this.disconnect_time++;
			if (this.disconnect_time>5) {
				online_game.finish_event('my_no_connection');
				return;				
			}
		}
		
		//определяем сколько времени прошло
		const move_time_left=this.time_for_move-(cur_time-this.move_time_start)*0.001;
		
		if (move_time_left < 0 && my_turn)	{			
			online_game.finish_event('my_timeout');
			return;
		}

		if (move_time_left < -5 && !my_turn) {			
			online_game.finish_event('opp_timeout');
			return;
		}

		if (connected === 0 && !my_turn) {
			this.disconnect_time ++;
			if (this.disconnect_time > 5) {
				online_game.finish_event('my_no_connection');
				return;				
			}
		}				
		
		//обновляем текст на экране
		this.cur_bar.width=move_time_left*7;
		
	}	
	
}

online_game={	
	
	on:0,
	start_time:0,
	move_time_start:0,
	disconnect_time:0,
	opp_conf_play:0,
	ball_placement_seed:0,
	write_fb_timer:0,
	confirm_start_timer:0,
	confirm_check_timer:0,
	help_info_timer:0,
	my_color:'',
	opp_color:'',
	table_state:'break',
	
	get_random(){		
		
		this.ball_placement_seed=(this.ball_placement_seed * 9301 + 49297) % 233280;
		return this.ball_placement_seed;
		
	},
		
	activate(seed, turn){
		
		this.on=1;
		
		my_turn=turn;
		
		if (sp_game.on)
			sp_game.close();
		
		//если открыты другие окна то закрываем их
		if (objects.chat_cont.visible) chat.close();
		if(objects.levels_cont.visible) levels.close();
		
		//устанавливаем локальный и удаленный статус
		set_state({state:'p'});		
		
		sound.play('start2');
		
		this.ball_placement_seed=seed;
		
		//показываем кнопки 
		objects.game_buttons.visible=true;	

		//включаем/перезапускаем таймер
		timer.start(1);
		
		//время начала игры
		this.start_time=Date.now();
		
		//вычиcляем рейтинг при проигрыше и устанавливаем его в базу он потом изменится
		my_data.lose_rating = this.calc_new_rating(my_data.rating, LOSE);
		my_data.win_rating = this.calc_new_rating(my_data.rating, WIN);
		my_data.draw_rating = this.calc_new_rating(my_data.rating, DRAW);
		fbs.ref('players/'+my_data.uid+'/rating').set(my_data.lose_rating);
		
		
		//расстанавливаем по треугольнику и перемешиваем------------------------
		const tri_side=25;
		const x_step=tri_side*0.866
		const half_fize=tri_side*0.5;
		let ball_ind=0;		

		//восстанавливаем цвета шаров
		for (let i=0;i<7;i++) objects.balls[i].set_color('red');		
		for (let i=7;i<14;i++) objects.balls[i].set_color('blue');

		const s_balls=[1,2,3,4,5,6,8,9,10,11,12,13].sort(() => 500-online_game.get_random()%1000);
		s_balls.splice(4,0,14);
		s_balls.splice(10,0,0);
		s_balls.push(7);		

		for (let x=0;x<5;x++){
		const y_start=262-half_fize*x;
		for (let y=0;y<x+1;y++){	
			const ball=objects.balls[s_balls[ball_ind]];
			ball.x=r2(500+x*x_step);
			ball.y=r2(y_start+y*tri_side);
			ball.random_orientation();
			ball.alpha=1;
			ball_ind++;
		}	
		}
		objects.balls.forEach(b=>b.reset());
		//----****---------*****------*****----------*****----------****--------
										
		//показываем и заполняем мою карточку
		anim3.add(objects.my_card_cont,{y:[-200,objects.my_card_cont.sy,'linear']}, true, 0.3);
		objects.my_card_name.set2(my_data.name,160);
		objects.my_card_rating.text=my_data.rating;
		objects.my_avatar.avatar.texture=players_cache.players[my_data.uid].texture;
			
		//показываем и заполняем карточку соперника
		anim3.add(objects.opp_card_cont,{y:[-200,objects.opp_card_cont.sy,'linear']}, true, 0.3);
		objects.opp_card_name.set2(opp_data.name,160);
		objects.opp_card_rating.text=opp_data.rating;
		objects.opp_avatar.avatar.texture=players_cache.players[opp_data.uid].texture;	
			
		anim3.add(objects.swords,{scale_xy:[0, 0.6666,'easeOutBack']}, true, 0.5);
				
		//общие параметры
		common.init();
				
		this.table_state='break';		
		this.my_color='';
		this.opp_color='';
		
		//шкалы шаров пока невидимы
		objects.my_potted_balls.forEach(b=>b.visible=false);
		objects.opp_potted_balls.forEach(b=>b.visible=false);
				
		//располагаем белый шар
		const white_ball=objects.balls[15];
		white_ball.x=250;
		white_ball.y=250+this.get_random()%100;
		white_ball.random_orientation();
		
		
		//показываем все элементы игры
		anim3.add(objects.board_stuff_cont,{y:[450,0,'linear'],alpha:[0,1,'linear']}, true, 0.5);
		
		this.prepare_next_move();
		
		//запоминаем оппонента
		opponent=this;
		
		
		//отправляем подтверждение что мы тоже играем
		clearTimeout(this.confirm_check_timer);
		clearTimeout(this.confirm_start_timer);
		
		//через 3 секунды отправляем сообщение что мы играем
		this.confirm_start_timer=setTimeout(function(){
			fbs.ref('inbox/'+opp_data.uid).set({sender:my_data.uid,message:'CONF_START',tm:Date.now()});			
		},2000);

		//через 10 секунд проверяем сообщение от соперника
		this.confirm_check_timer=setTimeout(function(){
			online_game.check_confirm();			
		},10000);
			
	
	},	
	
	check_confirm(){
		
		//проверяем было ли подтверждение от соперника
		if (!this.opp_conf_play) game.finish_event('no_opp_conf');
		
	},	
			
	send_move(data){		
						
		//отправляем ход онайлн сопернику (с таймаутом)
		clearTimeout(this.write_fb_timer);
		this.write_fb_timer=setTimeout(function(){game.stop('my_no_connection');}, 8000);  
		fbs.ref('inbox/'+opp_data.uid).set(data).then(()=>{	
			clearTimeout(this.write_fb_timer);			
		});	

		//включаем/перезапускаем таймер
		timer.stop();
	},
		
	game_buttons_down(e) {
				
		if (anim3.any_on()||!online_game.on){
			sound.play('locked');
			return
		};	
				
		const mx = e.data.global.x/app.stage.scale.x - objects.game_buttons.sx;
		const my = e.data.global.y/app.stage.scale.y - objects.game_buttons.sy;	
			
		let buttons_pos = [this.stickers_button_pos, this.chat_button_pos, this.giveup_button_pos];
		
		let min_dist=999;
		let min_button=-1;
		
		for (let b = 0 ; b < 3 ; b++) {			
			
			const anchor_pos = buttons_pos[b];	
			const dx = mx-anchor_pos[0];
			const dy = my-anchor_pos[1];
			const d = Math.sqrt(dx * dx + dy * dy);		

			if (d < 40 && d < min_dist) {
				min_dist = d;
				min_button_id = b;
			}
		}
		
		//подсветка кнопки
		if (min_button_id !== -1) {
			sound.play('click');			
			objects.hl_main_button.x=buttons_pos[min_button_id][0]+objects.game_buttons.sx;
			objects.hl_main_button.y=buttons_pos[min_button_id][1]+objects.game_buttons.sy;				
			anim3.add(objects.hl_main_button,{alpha:[1,0,'linear']}, false, 0.6,false);				
		}
	
					
		if (min_button_id === 0)
			stickers.show_panel();
		if (min_button_id === 1)
			this.send_message();
		if (min_button_id === 2)
			this.exit_button_down();
		
		
	},
	
	async exit_button_down(){
		
		/*if (Date.now()-this.start_time<10000){
			message.add(['Нельзя сдаваться в начале игры','can nott give up at the beginning of the game'][LANG])
			return;
		}*/
		
		let res = await confirm_dialog.show(['Сдаетесь?','Giveup?'][LANG]);
		if (res==='ok'&&this.on){
			fbs.ref('inbox/'+opp_data.uid).set({message:'END',sender:my_data.uid,tm:Date.now()});		
			this.finish_event('my_giveup');
		}	
		
	},
	
	async send_message(){
		
		if (anim3.any_on()||objects.stickers_cont.visible) {
			sound.play('locked');
			return
		};	
		
		const msg=await keyboard.read();
		
		//если есть данные то отправляем из сопернику
		if (msg){
			fbs.ref('inbox/'+opp_data.uid).set({sender:my_data.uid,message:'CHAT',tm:Date.now(),data:msg});
			message.add({text:msg, timeout:3000,sound_name:'online_message',sender:'me'});
		}			
	},
			
	calc_new_rating(old_rating, game_result) {		
		
		if (game_result === NOSYNC)
			return old_rating;
		
		var Ea = 1 / (1 + Math.pow(10, ((opp_data.rating-my_data.rating)/400)));
		if (game_result === WIN)
			return Math.round(my_data.rating + 16 * (1 - Ea));
		if (game_result === DRAW)
			return Math.round(my_data.rating + 16 * (0.5 - Ea));
		if (game_result === LOSE)
			return Math.round(my_data.rating + 16 * (0 - Ea));
		
	},

	chat(data) {
	
		message.add({text:data, timeout:10000,sound_name:'online_message',sender:'opp'});
		
	},
			
	move_finish_event(){
		
		if(!this.on) return;
		
		//обрабатываем результат
		(()=>{
			
			//забил хоть что-то прицельное
			const any_potted=common.potted_balls.some(b=>['red','blue'].includes(b.color));
			
			//забили биток
			const white_potted=common.potted_balls.some(b=>b.color==='white');
			
			//забили черный
			const black_potted=common.potted_balls.some(b=>b.color==='black');
			
			//цвет которым играет текущий игрок
			const player_color=[this.opp_color,this.my_color][my_turn];
			
			//цвет которым играет соперник текущего игрока
			const opp_color={'red':'blue','blue':'red'}[player_color];
			
			//забил свой шар(ы)
			const player_potted=common.potted_balls.filter(function(b){return b.color===player_color});
			
			//забитые чужой шар(ы)
			const opp_potted=common.potted_balls.filter(function(b){return b.color===opp_color});
			
			//сколько осталось положить текущему игроку
			const left_to_pot = objects.balls.filter(b => {return b.color === player_color && b.on}).length;
			
			if (this.table_state==='break'){
							
				if (white_potted){				

					if (my_turn)
						common.show_info(['Вы забили белый шар! Переход хода.','You potted the white ball! The turn passes to your opponent.'][LANG]);
					else
						common.show_info(['Соперник забил белый шар! Переход хода.','Opponent potted the white ball! Your turn.'][LANG]);
					
					my_turn=1-my_turn;				
					//возвращаем белый шар на доску
					common.restore_ball(objects.balls[15]);
					
				}else{
					
					if (any_potted){		

						if (my_turn)
							common.show_info(['Вы забили один из цветных шаров! Следующий забитый шар определит цветовую группу шаров которая будет закреплена за игроками.','You have pocketed one of the colored balls! The next ball pocketed will determine the color group of balls that will be assigned to the players.'][LANG]);
						else
							common.show_info(['Соперник забил один из цветных шаров! Следующий забитый шар определит цветовую группу шаров которая будет закреплена за игроками.','Opponent have pocketed one of the colored balls! The next ball pocketed will determine the color group of balls that will be assigned to the players.'][LANG]);
					}else{				

						if (my_turn)
							common.show_info(['Вы ничего не забили!  Ход переходит к сопернику.',"You didn't pot anything! The turn passes to your opponent."][LANG]);
						else
							common.show_info(['Соперник ничего не забил!  Теперь Ваш ход.',"Your opponent didn't pot anything! It's your turn now."][LANG]);

						my_turn=1-my_turn;					
					}			
				}	

				if (black_potted){
					//возвращаем черный шар на доску
					common.restore_ball(objects.balls[14]);
				}
				
				this.table_state='open'		
				return;
			}
			
			if (this.table_state==='open'){
							
				//положили черный шар
				if (black_potted){		

					if (my_turn){
						this.finish_event('me_black_potted');
						common.show_info(['Вы забили черный шар! Этого нельзя делать!  Вы проиграли.',"You potted the black ball! That's not allowed! You lost!"][LANG]);						
					} else {
						this.finish_event('opp_black_potted');
						common.show_info(['Соперник забил черный шар! Этого нельзя делать!  Вы выиграли.',"Your opponent potted the black ball! That's not allowed! You win!"][LANG]);					
					}
					return;
				}
						
				//положили белый шар
				if (white_potted){
					
					if (my_turn)
						common.show_info(['Белый шар попал в лузу! Этого нельзя делать!  Ход переходит к сопернику.',"The white ball went into the pocket! That's not allowed! The turn passes to your opponent."][LANG]);
					else
						common.show_info(['Белый шар попал в лузу! Этого нельзя делать!  Ваш ход.',"The white ball went into the pocket! That's not allowed! Your turn."][LANG]);
					
					my_turn=1-my_turn;
					
					//возвращаем белый шар на доску
					common.restore_ball(objects.balls[15]);
					
				}else{
					
					if (any_potted){
						
						const potted_ball=common.potted_balls.find(b=>['red','blue'].includes(b.color));

						if (my_turn){
							this.my_color=potted_ball.color;					
							this.opp_color={'red':'blue','blue':'red'}[potted_ball.color];						
						}else{
							this.my_color={'red':'blue','blue':'red'}[potted_ball.color];
							this.opp_color=potted_ball.color;		
						}
						
						//цвета моих и других шаров в статистике
						this.assign_stat_balls_colors();
						
						//цвета определены и обновляем статистику
						this.update_balls_stat();						
							
						this.table_state='game';					
											
						
						if (my_turn)
							common.show_info([`Вы забили шар(ы)! Теперь Ваш цвет - ${{'red':'красный','blue':'синий'}[this.my_color]}. Вам нужно забить все шары этого цвета и начинать удар тоже с них.`,`You potted ball(s). Now your color is ${this.my_color}. You need to pot all balls of this color and start your turn with them too.`][LANG]);
						else
							common.show_info([`Соперник забил шар(ы)! Теперь Ваш цвет - ${{'red':'красный','blue':'синий'}[this.my_color]}. Вам нужно забить все шары этого цвета и начинать удар тоже с них.`,`Opponents potted ball(s)! Now your colos is this.my_color. You need to pot all balls of this color and start your turn with them too.`][LANG]);

											
					}else{	
					
						
						if (my_turn)
							common.show_info(['Вы ничего не забили!  Ход переходит к сопернику.',"You didn't pot anything! The turn passes to your opponent."][LANG]);
						else
							common.show_info(['Соперник ничего не забил!  Теперь Ваш ход.',"Your opponent didn't pot anything! It's your turn now."][LANG]);
						
						
						my_turn=1-my_turn;					
						
					}
				}
				
				return;
			}
			
			if (this.table_state==='game'){
													
							
				//положили черный шар
				if (black_potted){			

					if(left_to_pot){					
						
						if (my_turn){
							common.show_info(['Вы проиграли! Черный шар можно забивать только после того как забьете все шары своего цвета!',"You lost! You can only pot the black ball after potting all your colored balls!"][LANG]);
							this.finish_event('me_black_potted');
						} else {
							common.show_info(['Вы выиграли! Соперник забил черный шар до того как забил все шары своего цвета!',"You won! Your opponent potted the black ball before potting all their colored balls!"][LANG]);
							this.finish_event('opp_black_potted_wrong');
						}
						
						return;
					}
					
					if(common.first_ball_hited!=='black'){
						
						if (my_turn){
							common.show_info(['Вы проиграли! Забили черный шар, но начали с чужого!',"You lost! You potted the black ball but started with an opponent's ball!"][LANG]);
							this.finish_event('me_black_potted_wrong');
						} else {
							common.show_info(['Вы выиграли! Соперник забил черный шар, но начал с чужого!',"You won! Your opponent potted the black ball but started with an opponent's ball!"][LANG]);
							this.finish_event('opp_black_potted_wrong');
						}
						
						return;
					}
					
					if(white_potted||opp_potted.length){
					
						if (my_turn){
							common.show_info(['Вы проиграли! Забили черный шар, но также забили чужой шар!',"You lost! You potted the black ball but also potted an opponent's ball!"][LANG]);
							this.finish_event('me_black_potted_wrong');
						} else {
							common.show_info(['Вы выиграли! Соперник забил черный шар, но также забил чужой шар!',"You won! Your opponent potted the black ball but also potted an opponent's ball!"][LANG]);
							this.finish_event('opp_black_potted_wrong');
						}					
						return;
					}				
		
					if (my_turn){
						common.show_info(['Вы выиграли! Забили все шары своей группы и черный шар по всем правилам!',"You won! You potted all your group’s balls and the black ball by the rules!"][LANG]);
						this.finish_event('me_win');
					} else {
						common.show_info(['Вы проиграли! Соперник забил все шары своей группы и черный шар по всем правилам!',"You lost! Your opponent potted all their group’s balls and the black ball by the rules!"][LANG]);
						this.finish_event('opp_win');
					}
		
					return;
				}
							
				if (white_potted){				
					
					if (my_turn)
						common.show_info(['Белый шар попал в лузу! Этого нельзя делать!  Ход переходит к сопернику.',"The white ball went into the pocket! That's not allowed! The turn passes to your opponent."][LANG]);
					else
						common.show_info(['Белый шар попал в лузу! Этого нельзя делать!  Ваш ход.',"The white ball went into the pocket! That's not allowed! Your turn."][LANG]);
					
					my_turn=1-my_turn;
					
					//возвращаем белый шар на доску
					common.restore_ball(objects.balls[15]);
					
				}else{				
					
					if (common.first_ball_hited===player_color){
						
						if (player_potted.length){						
						
							if (my_turn){
								if (left_to_pot)
									common.show_info(['Вы забили правильный шар! Продолжайте игру.',"You potted the right ball! Keep playing."][LANG]);
								else
									common.show_info(['Вы забили все ваши шары! Осталось забить черный шар.',"You potted all your balls! Now pot the black ball to win."][LANG]);
							}
							else {
								if (left_to_pot)
									common.show_info(['Соперник забил правильный шар и продолжает игру.',"Your opponent potted the correct ball and continues its turn."][LANG]);
								else
									common.show_info(['Соперник забил все свои шары! Ему осталось забить черный шар.',"Your opponent potted all their balls! He need to pot the black ball next."][LANG]);
							}
							
						}else{
							
							if (any_potted){
								
								if (my_turn)
									common.show_info(['Вы забили, но чужой шар(ы)! Ход перходит к сопернику.',"You potted, but hit the wrong ball(s)! The turn passes to your opponent."][LANG]);
								else
									common.show_info(['Соперник забил, но чужой шар(ы)! Ваш ход.',"Your opponent potted, but hit the wrong ball(s)! Your turn."][LANG]);
								
							} else {
								
								if (my_turn)
									common.show_info(['Вы ничего не забили! Ход перходит к сопернику.',"You didn't pot anything! The turn passes to your opponent."][LANG]);
								else
									common.show_info(['Соперник ничего не забил! Ваш ход.',"Your opponent didn't pot anything! Your turn."][LANG]);
								
							}
								
							my_turn=1-my_turn;							
								
						}					
						
					}else{
						
						//не получилось положить последний черный шар
						if (common.first_ball_hited==='black'&&!left_to_pot){		

							if (my_turn)
								common.show_info(['У Вас не получилось забить черный шар! Ход перходит к сопернику.',"You failed to pot the black ball! The turn passes to your opponent."][LANG]);
							else
								common.show_info(['У соперника не получилось забить черный шар! Ваш ход.',"Your opponent failed to pot the black ball! Your turn."][LANG]);
							
							my_turn=1-my_turn;
							return;
						}
						
						
						if (any_potted){
							
							if (my_turn)
								common.show_info(['Вы забили, но начали не со своего шара! Ход перходит к сопернику.',"You potted but didn't start with your ball"][LANG]);
							else
								common.show_info(['Соперник забил, о начал не со своего шара! Ваш ход.',"The opponent potted, but he didn't start with his ball! Your turn."][LANG]);
							
							
						} else {
							
							if (my_turn)
								common.show_info(['Вы ничего не забили! Ход переходит к сопернику.',"You didn't pot anything! Opponent's turn."][LANG]);
							else
								common.show_info(['Соперник ничего не забил! Ваш ход.',"The opponent didn't pot anything! Your turn."][LANG]);
							
						}
				
						my_turn=1-my_turn;

					}
					

				}
				return;
			}			
			
		})();
			
		//готовим следующий ход
		this.prepare_next_move();
		
	},
	
	move_start_event(dx,dy){
		
		if (!this.on) return;
		this.send_move({sender:my_data.uid,message:'MOVE',data:{dx,dy},tm:Date.now()});
		
		//снижаем уровень кия
		if (my_data.cue_id>1){
			my_data.cue_resource[my_data.cue_id]--;
			if (my_data.cue_resource[my_data.cue_id]<=0){
				common.set_cue_level(1);					
				sys_msg.add(['Ресурс кия закончился!','Cue is exhausted!'][LANG])
			}
	

			//сохраняем в хранилище
			safe_ls('pool_cue_data',my_data.cue_resource);
		}
		
	},
	
	prepare_next_move(){
		
		//готовим следующий ход
		if (!this.on) return;
				
		if (my_turn){
			
			if (this.table_state==='break')
				common.show_info('Ваш ход. Разбейте пирамиду.');
			
			if (this.table_state==='open')
				console.log('забейте красный или синий шар!');
			
			if (this.table_state==='game')
				console.log('забейте шар вашего цвета!');
				
			objects.stick.visible=true;
			objects.stick_direction.visible=true;
			objects.guide_orb.visible=true;			
			anim3.add(objects.hit_level_cont,{x:[800, objects.hit_level_cont.sx,'linear']}, true, 0.4);

		
			
		}else{
			
			if (this.table_state==='break')
				common.show_info('Соперник начинает игру.');
			
			if (this.table_state==='open')
				console.log('соперник должен забить красный или синий шар!');
			
			if (this.table_state==='game')
				console.log('соперник должен забить свой шар!');
			
			objects.stick.visible=false;
			objects.stick_direction.visible=false;
			objects.hit_level_cont.visible=false;
			objects.guide_orb.visible=false;
		}	
		
		common.reset_cue();
		timer.start();
		
		
	},
		
	async finish_event(result){
		
		if (!this.on) return;
		this.on=0;
		this.move_on=0;
		
		//убираем таймер
		timer.stop();
		objects.hit_level_cont.visible=false;
		objects.game_buttons.visible=false;
		
		some_process.game=function(){};		
		objects.stick.visible=false;
		objects.guide_orb.visible=false;
		
		await fin_dialog.show(result);
		opponent.close();		
		this.close();
		lobby.activate();
		
	},
		
	assign_stat_balls_colors(){	
	
		for(const ball of objects.my_potted_balls){
			ball.bcg.tint=TINTS[this.my_color].bcg;
			ball.strip.tint=TINTS[this.my_color].strip;
		}

		for(const ball of objects.opp_potted_balls){
			ball.bcg.tint=TINTS[this.opp_color].bcg;
			ball.strip.tint=TINTS[this.opp_color].strip;		
		}
		
	},
		
	update_balls_stat(){
		
		const num_of_my_balls=common.potted_balls_total.filter(b=>{return b.color===online_game.my_color}).length;
		const num_of_opp_balls=common.potted_balls_total.filter(b=>{return b.color===online_game.opp_color}).length;
		
		for (let i=0;i<num_of_my_balls;i++){
			const ball=objects.my_potted_balls[i];
			if(!ball.visible)
				ball.add_to_stat();			
		}

		for (let i=0;i<num_of_opp_balls;i++){
			const ball=objects.opp_potted_balls[i];
			if(!ball.visible)
				ball.add_to_stat();			
		}
	},
			
	ball_potted_event(ball,hole_data){
				
		if(!this.on) return;	
				
		//показываем анимацию
		const orb=objects.anim_orbs.find(o=>o.visible===false);
		if (orb)
			orb.activate(hole_data[0],hole_data[1]);
		
		//добавляем шар с список попавших в лузу
		common.potted_balls.push(ball);
		common.potted_balls_total.push(ball);
		
		if (this.table_state==='game')
			this.update_balls_stat();	
		
		//добавляем на боковую панель
		for (let mball of objects.move_potted_balls){
			if (!mball.visible){
				mball.set_color(ball.color);
				mball.add_to_stat();
				break;
			}			
		}
		
	},
			
	close(){
		
		clearTimeout(this.confirm_check_timer);
		clearTimeout(this.confirm_start_timer);
		
		this.on=0;
		anim3.add(objects.board_stuff_cont,{y:[0,450,'linear']}, false, 0.5);
		objects.hit_level_cont.visible=false;
		objects.swords.visible=false;
		objects.my_card_cont.visible=false;
		objects.opp_card_cont.visible=false;
		set_state({state:'o'});	
		
	}
		
}

pref={
	
	bonuses:10,
	avatar_switch_center:0,
	avatar_swtich_cur:0,
	cur_cue_id:1,	
	cur_board_id:1,
	cur_pic_url:'',
	max_cue_resource:[100,100,120,150,200,300,500,1000],
	hours_to_nick_change:0,
	hours_to_photo_change:0,
	
	activate(){
		
		//последние изменения имен и аватар
		my_data.avatar_tm=safe_ls('pool_avatar_tm')||1;
		my_data.nick_tm=safe_ls('pool_nick_tm')||1;
		
		anim3.add(objects.pref_cont,{x:[-800,objects.pref_cont.sx,'linear']}, true, 0.2);
		//this.set_stick_perc_level(this.stick_perc);
		//objects.pref_t_bonuses.text=this.bonuses+'%';
		
		objects.bcg.texture=assets.lobby_bcg_img;	
		anim3.add(objects.bcg,{alpha:[0,1,'linear']}, true, 0.5);	
		
		//заполняем имя и аватар
		objects.pref_name.set2(my_data.name,260);
		objects.pref_avatar.set_texture(players_cache.players[my_data.uid].texture);	
		
		objects.pref_table_icon.texture=assets['board'+my_data.board_id];	
		
		this.avatar_switch_center=this.avatar_swtich_cur=irnd(9999,999999);
		this.cur_pic_url=my_data.pic_url;
				
		this.cur_cue_id=my_data.cue_id;
		this.cue_switch_down(0);
		
		this.cur_board_id=my_data.board_id;
		this.table_switch_down(0);
		
		this.update_buttons();
		
	},		
	
	update_buttons(){
		
		objects.pref_save_photo_btn.visible=false;
		
		//исходное фото если другое
		objects.pref_reset_photo_btn.visible=this.cur_pic_url!==my_data.orig_pic_url		
		
		//сколько осталось до изменения
		const tm=Date.now();
		this.hours_to_photo_change=Math.max(0,Math.floor(720-(tm-my_data.avatar_tm)*0.001/3600));
		this.hours_to_nick_change=Math.max(0,Math.floor(720-(tm-my_data.nick_tm)*0.001/3600));
		
		//определяем какие кнопки доступны
		objects.pref_change_name_btn.alpha=(this.hours_to_nick_change>0)?0.5:1;
		objects.pref_prv_avatar_btn.alpha=(this.hours_to_photo_change>0)?0.5:1;
		objects.pref_next_avatar_btn.alpha=(this.hours_to_photo_change>0)?0.5:1;	
		
	},
	
	getHoursEnding(hours) {
		hours = Math.abs(hours) % 100;
		let lastDigit = hours % 10;

		if (hours > 10 && hours < 20) {
			return 'часов';
		} else if (lastDigit == 1) {
			return 'час';
		} else if (lastDigit >= 2 && lastDigit <= 4) {
			return 'часа';
		} else {
			return 'часов';
		}
	},
		
	table_switch_down(dir){
		
		if (dir&&anim3.any_on()) {
			sound.play('locked');
			return
		};				
		if(dir) sound.play('click');
		
		this.cur_board_id+=dir;
		if (this.cur_board_id>10)this.cur_board_id=10;
		if (this.cur_board_id<1)this.cur_board_id=1;
		
		if (this.cur_board_id===my_data.board_id)
			objects.pref_table_save_btn.alpha=0.5
		else
			objects.pref_table_save_btn.alpha=1
	
		objects.pref_table_icon.texture=assets['board'+this.cur_board_id];

	},
	
	table_save_btn_down(){
		
		if (this.cur_board_id===my_data.board_id){
			sound.play('locked');
			this.send_info(['Это ваш текущий дизайн стола, выберите другой!','This is a current table design, choose other!'][LANG])
			return;
		}
		
		my_data.board_id=this.cur_board_id;
		fbs.ref(`players/${my_data.uid}/board_id`).set(my_data.board_id);		
		this.table_switch_down(0);
		sound.play('note1');
		
		this.send_info(['Дизайн стола изменен!','Table design has been changed!'][LANG])
	},
	
	check_time(last_time){

		if(!SERV_TM){
			objects.pref_info.text=['Какая-то ошибка, попробуйте позже.','Error! Try again later.'][LANG];
			return;			
		}

		//провряем можно ли менять
		const days_since_nick_change=~~((SERV_TM-last_time)/86400000);
		const days_befor_change=30-days_since_nick_change;
		const ln=days_befor_change%10;
		const opt=[0,5,6,7,8,9].includes(ln)*0+[2,3,4].includes(ln)*1+(ln===1)*2;
		const day_str=['дней','дня','день'][opt];
		
		if (days_befor_change>0){
			objects.pref_info.text=[`Поменять можно через ${days_befor_change} ${day_str}`,`Wait ${days_befor_change} days`][LANG];
			anim3.add(objects.pref_info,{alpha:[0,1,'easeBridge']}, false, 3,false);	
			sound.play('locked');
			return 0;
		}
		
		return 1;
	},
			
	send_info(msg,timeout){
		
		objects.pref_info.text=msg;
		anim3.add(objects.pref_info,{alpha:[0,1,'linear']}, true, 0.25,false);
		clearTimeout(this.info_timer);
		this.info_timer=setTimeout(()=>{
			anim3.add(objects.pref_info,{alpha:[1,0,'linear']}, false, 0.25,false);	
		},timeout||3000);	
	},
			
	async change_name_down(){
				
		if (objects.chat_keyboard_cont.visible){
			sound.play('locked');
			return;
		}
		
		if (anim3.any_on()) {
			sound.play('locked');
			return
		};
		
		//провряем можно ли менять фото
		if(this.hours_to_nick_change>0){
			this.send_info(`Имя можно поменять через ${this.hours_to_nick_change} ${this.getHoursEnding(this.hours_to_nick_change)}.`);
			sound.play('locked');
			return;
		} 	
		
		sound.play('click');
				
		const name=await keyboard.read(15);
		
		if (name.length>3&&name.replaceAll(' ','').length>3){		
		
			//устанавливаем новое имя
			my_data.name=name;	
			objects.pref_name.set2(name,260);
			
			//запоминаем дату установки
			my_data.nick_tm=Date.now();
			safe_ls('pool_nick_tm',my_data.nick_tm)
			
			this.update_buttons();			

			sound.play('note1');
			this.send_info(['Имя игрока было изменено!',"Player's name has been changed!"][LANG]);

		}else{	
			sound.play('locked');
			this.send_info(['Какая-то ошибка','Unknown error'][LANG]);
			anim3.add(objects.pref_info,{alpha:[0,1,'easeBridge']}, false, 3,false);			
		}
		
	},
	
	close(){
		
		//показываем и заполняем мою карточку
		anim3.add(objects.pref_cont,{alpha:[1,0,'linear']}, false, 0.3);
	},
	
	snd_down(){
		
		if (sound.on){			
			sound.on=0;
			this.send_info(['Звуки отключены','Sounds off'][LANG]);
			anim3.add(objects.pref_snd_slider,{x:[506,450,'linear']}, true, 0.12);				
		}else{
			sound.on=1;
			sound.play('click');
			this.send_info(['Звуки включены','Sounds on'][LANG]);
			anim3.add(objects.pref_snd_slider,{x:[450,506,'linear']}, true, 0.12);	
		}	
		
	},
	
	music_down(){
		
		if (music.on){			
			music.on=0;
			this.send_info(['Музыка отключена','Music off'][LANG]);
			assets.music.stop();
			anim3.add(objects.pref_music_slider,{x:[691,633,'linear']}, true, 0.12);//-47			
		}else{
			music.on=1;
			this.send_info(['Музыка включена','Music on'][LANG]);
			assets.music.play();
			anim3.add(objects.pref_music_slider,{x:[633,691,'linear']}, true, 0.12);	
		}	

		safe_ls('pool_music',music.on);
		
	},
	
	init_music(){		
		music.on=safe_ls('pool_music')??1;		
		if (music.on){			
			assets.music.play();
			objects.pref_music_slider.x=691;
		}else{
			objects.pref_music_slider.x=635;
		}
		assets.music.loop=true;
	},
	
	back_btn_down(){
		
		if (anim3.any_on()) {
			sound.play('locked');
			return
		};
		sound.play('click');
		
		this.close();
		main_menu.activate();		
		
	},	
	
	cue_switch_down(dir){
		
		if (dir&&anim3.any_on()) {
			sound.play('locked');
			return
		};				
		if(dir) sound.play('click');
		
		this.cur_cue_id+=dir;
		if (this.cur_cue_id>7)this.cur_cue_id=7;
		if (this.cur_cue_id<1)this.cur_cue_id=1;
		
		const cur_cue_resource=my_data.cue_resource[this.cur_cue_id];
		const cur_cue_max_resource=this.max_cue_resource[this.cur_cue_id];
		
		//нельзя восстановить первый кий или максимальный кий
		if (cur_cue_resource===cur_cue_max_resource||this.cur_cue_id===1)
			objects.pref_cue_buy_btn.alpha=0.5
		else
			objects.pref_cue_buy_btn.alpha=1		
		
		objects.pref_cue_level.text=['Уровень: ','Level: '][LANG]+this.cur_cue_id;
		
		objects.pref_cue_info.text=['Ресурс: ','Durability: '][LANG]+cur_cue_resource+"/"+cur_cue_max_resource;
		if (this.cur_cue_id===my_data.cue_id)
			objects.pref_cue_level.text+=[' (активный)',' (active)'][LANG];			
		
		//кнопка выбора работает только где есть ресурс
		if (cur_cue_resource===0||this.cur_cue_id===my_data.cue_id)
			objects.pref_cue_select_btn.alpha=0.5;
		else
			objects.pref_cue_select_btn.alpha=1;			
		
		objects.pref_cue_photo.texture=assets['cue'+this.cur_cue_id];
		
	},
	
	cue_buy_down(){		
		
		if (anim3.any_on()) {
			sound.play('locked');
			return
		};

		
		//нельзя восстановить первый кий или максимальный кий
		if (objects.pref_cue_buy_btn.alpha!==1){
			this.send_info(['Невозможно восстановить!','Can not resore!'][LANG])			
			sound.play('locked');
			return;
		}
		
		sound.play('click');
		
		const item='cue'+this.cur_cue_id;
		
		if (game_platform==='VK') {			
			vkBridge.send('VKWebAppShowOrderBox', { type: 'item', item}).then(data =>{
				this.restore_cue(this.cur_cue_id)
				my_ws.safe_send({cmd:'log_inst',logger:'payments',data:{game_name,uid:my_data.uid,name:my_data.name,item_id:item}});
			}).catch(err => {
				this.send_info(['Ошибка при покупке!','Error!'][LANG]);
			});					
		};	
		
		if (game_platform==='YANDEX') {
			yndx_payments.purchase({id: item }).then(purchase => {	
				this.restore_cue(this.cur_cue_id)
				my_ws.safe_send({cmd:'log_inst',logger:'payments',data:{game_name,uid:my_data.uid,name:my_data.name,item_id:item}});	
				yndx_payments.consumePurchase(purchase.purchaseToken);
			}).catch(err => {
				this.send_info(['Ошибка при покупке!','Error!'][LANG]);
			})			
		}
		

		if (game_platform!=='VK'&&game_platform!=='YANDEX')
			this.restore_cue(this.cur_cue_id)
		
	},
		
	restore_cue(cue_id){
	
		//восстанавливаем максимальный ресурс
		my_data.cue_resource[cue_id||this.cur_cue_id]=this.max_cue_resource[cue_id||this.cur_cue_id]
		
		this.cue_switch_down(0)		
		
		//записываем в хранилище
		safe_ls('pool_cue_data',my_data.cue_resource)
		
		sound.play('note1');
		this.send_info(['Игрок восстановил кий!','Player has updated a cue'][LANG])
		
	},
	
	cue_select_down(){		
		
		if (anim3.any_on()) {
			sound.play('locked');
			return
		};		
		
		//нельзя восстановить первый кий или максимальный кий
		if (objects.pref_cue_select_btn.alpha!==1){
			this.send_info(['Невозможно выбрать!','Can not choose!'][LANG])
			sound.play('locked');
			return;
		}
		
		this.send_info(['Игрок изменил кий!','Player has changes cue!'][LANG])
		
		sound.play('note1')
		my_data.cue_id=this.cur_cue_id;
		this.cue_switch_down(0);
		
	},
		
	async avatar_switch_down(dir){
		
		if (dir&&anim3.any_on()) {
			sound.play('locked');
			return
		};				
		
		//провряем можно ли менять фото
		if(this.hours_to_photo_change>0){
			this.send_info(`Фото можно поменять через ${this.hours_to_photo_change} ${this.getHoursEnding(this.hours_to_photo_change)}.`);
			sound.play('locked');
			return;
		} 	
		
		if(dir) sound.play('click');		
						
		//перелистываем аватары
		this.avatar_swtich_cur+=dir;
		if (this.avatar_swtich_cur===this.avatar_switch_center){
			objects.pref_save_photo_btn.visible=false;	
			this.cur_pic_url=my_data.pic_url;
		}else{
			objects.pref_save_photo_btn.visible=true;
			this.cur_pic_url='mavatar'+this.avatar_swtich_cur;
		}		
				
		this.tex_loading=1;		
		const t=await players_cache.my_texture_from(multiavatar(this.cur_pic_url));
		this.tex_loading=0;		
		objects.pref_avatar.set_texture(t);
		
	},
	
	save_photo_down(){
	
		if (anim3.any_on()) {
			sound.play('locked');
			return
		};
		sound.play('click');
	
		objects.pref_save_photo_btn.alpha=0.5;
		
		//запоминаем новое имя
		my_data.pic_url=this.cur_pic_url;			
		fbs.ref(`players/${my_data.uid}/pic_url`).set(this.cur_pic_url);
		
		//запоминаем дату
		my_data.avatar_tm=Date.now();		
		safe_ls('pool_avatar_tm',my_data.avatar_tm)
				
		this.update_buttons();
			
		//обновляем аватар в кэше
		players_cache.update_avatar_forced(my_data.uid,this.cur_pic_url).then(()=>{
			const my_card=objects.mini_cards.find(card=>card.uid===my_data.uid);
			my_card.avatar.set_texture(players_cache.players[my_data.uid].texture);				
		})		
		
		sound.play('note1');
		this.send_info(['Игрок обновил фото!',"Player's photo has been changed!"][LANG]);
		
	},	
	
	async restore_photo_down(){
		
		if (anim3.any_on()) {
			sound.play('locked');
			return
		};
		sound.play('click');
		
		this.cur_pic_url=my_data.orig_pic_url;
		const t=await players_cache.my_texture_from(my_data.orig_pic_url);
		objects.pref_avatar.set_texture(t);
		objects.pref_save_photo_btn.visible=true;
		
	},
	
	get_draw_amount(){	
		return [200,200,230,260,300,350,400,450,450,450,450,450][my_data.cue_id];//[1-7]
	},	
	
	counume_yndx_purchases(){
		
		if(!yndx_payments) return;
		
		//необработанные покупки				
		yndx_payments.getPurchases().then(purchases => purchases.forEach(purchase=>{				
			if (purchase.productID.includes('cue')){					
				this.restore_cue(+purchase.productID.slice(-1));
				yndx_payments.consumePurchase(purchase.purchaseToken)						
			}					
		}));				

	}
}

levels={
	
	order:[],
	scale:[0.5,0.7,0.9,0.7,0.5],
	posx:[170,280,400,510,620],
	posy:[210,200,210,200,180],
	active_level:1,
	stat:0,
	
	activate(){
		
		objects.bcg.texture=assets.lobby_bcg_img;			
		anim3.add(objects.bcg,{alpha:[0,1,'linear']}, true, 0.25);		
		
		objects.levels_header.visible=true;
		objects.levels_cont.visible=true;
		objects.levels_left_btn.visible=true;
		objects.levels_right_btn.visible=true;
		objects.levels_play_btn.visible=true;		
		
		//загружаем прогресс из локального хранилища
		if (!this.stat)
			this.load_stat();
		
		//определяем текущий уровень
		this.active_level=this.stat.length;
		
		//тупо размещаем иконки уровней
		for (let i=0;i<5;i++){
			const icon=objects.level_icons[i];
			icon.scale_xy=this.scale[i];
			icon.x=this.posx[i];
			icon.y=this.posy[i];	
			this.order[i]=icon;
			
			const level=this.active_level-2+i;
			this.set_level_to_icon(icon,level);	
		}
		
	},
	
	set_level_to_icon(icon,level){
		
		if (level<0||level>=sp_game.levels_data.length){
			icon.visible=false;
			return;
		}
		
		icon.visible=true;
		
		if (level<this.stat.length){
			const stars=this.stat[level];
			icon.stars_icon.texture=assets[`starsx${stars}`];				
			icon.stars_icon.visible=true;
		}
		else
			icon.stars_icon.visible=false;			
		
		
		if (level===0){
			icon.t.visible=false;
			icon.bcg.texture=assets.level_tutor_img;
			return;
		}
		

		if (level>0){
			icon.bcg.texture=assets.level_img;
			icon.t.visible=true;
			icon.t.text=level;
			return;
		}	
		
	
		
	},	
	
	load_stat(){
		
		const stat_str=safe_ls(STAT_LS_KEY);
		if (stat_str)
			this.stat=stat_str.split('').map(Number);
		else
			this.stat=[];
	},
	
	save_stat(level,stars){
		
		const this_level_stat=this.stat[this.cur_level];
		this.stat[level]=stars;
		safe_ls(STAT_LS_KEY,this.stat.join(''));	
		
	},
	
	update_stars(level_icon){
		
		//определяем сколько звезд
		const level=level_icon.t.text;
		const stars_num=this.stat[level];
		if (stars_num){
			level_icon.stars_icon.texture=assets[`starsx${stars_num}`];				
			level_icon.stars_icon.visible=true;
		}
		else
			level_icon.stars_icon.visible=false;
		
	},
	
	switch_down(dir){
			
		if(anim3.any_on()){
			sound.play('locked');
			return;
		}
				
				
		//проверяем следующий уровень
		const next_level=this.active_level+dir;
			
		//если это последний уровень
		if (next_level===sp_game.levels_data.length-1){
			sys_msg.add(['Больше нет уровней!','No more levels!'][LANG])
			sound.play('locked');
			return;
		} 
		
		//если уровень еще не пройден
		if (next_level>this.stat.length){
			sys_msg.add(['Завершите предыдущий уровень!','Complete previous level!'][LANG])
			sound.play('locked');
			return;
		} 
		
		//если отрицательный уровень
		if (next_level<0){
			sys_msg.add(['Недоступно!','Error!'][LANG])
			sound.play('locked');
			return;
		} 
		
		
		this.active_level=next_level;
		
			
		if (dir===1){			
			const first=this.order.shift();
			first.x=700;
			this.order.push(first)	
			this.set_level_to_icon(first,this.active_level+2)			
		}else{			
			const last=this.order.pop()
			last.x=0;
			this.order.unshift(last)			
			this.set_level_to_icon(last,this.active_level-2)			
		}		
		
		sound.play('click');		

		//перемещаем иконки уровней
		for (let i=0;i<5;i++){
			const icon=this.order[i];
			if (icon.visible)
				anim3.add(icon,{x:[icon.x, this.posx[i],'easeOutBack'],y:[icon.y,this.posy[i],'linear'],scale_xy:[icon.scale_xy,this.scale[i],'linear']}, true, 0.25);
		}
		
		
	},
	
	close(){
		
		objects.levels_header.visible=false;
		objects.levels_cont.visible=false;
		objects.levels_left_btn.visible=false;
		objects.levels_right_btn.visible=false;
		objects.levels_play_btn.visible=false;	
		
	},
	
	exit_btn_down(){
		
		if (anim3.any_on()) {
			sound.play('locked');
			return
		};
		sound.play('click');
		
		this.close();
		main_menu.activate();		
		
	},
	
	play_down(){		
		
		if (anim3.any_on()) {
			sound.play('locked');
			return
		};
		sound.play('click');
		
		this.close();
		sp_game.activate(this.active_level);
		
		
	}
	
}

sp_game={
		
	on:0,
	life:3,
	cur_level:0,
	cur_level_data:0,
	attemps_left:30,
	seconds_left:100,
	seconds_total:100,
	timer:0,
	balls_in_puzzle:[],
	info_window_resolver:0,
		
	levels_data:0,
			
	activate(level){
		
		this.cur_level=level;
		
		//сначала все отключаем
		objects.balls.forEach(b=>{b.on=0;b.visible=false});			
				
		objects.spgame_cont.visible=true;
				
		this.shots_left=30;
				
		sound.play('ready2');
				
		this.init_level();		
	},
	
	format_time(seconds) {
		// Ensure the input is a non-negative number
		if (typeof seconds !== 'number' || seconds < 0) {
			return '00:00';
		}

		// Calculate minutes and seconds
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;

		// Pad minutes and seconds with leading zeros if necessary
		const formattedMinutes = String(minutes).padStart(2, '0');
		const formattedSeconds = String(remainingSeconds).padStart(2, '0');

		// Return the formatted time as MM:SS
		return `${formattedMinutes}:${formattedSeconds}`;
	},
	
	tick(){			
	
		if (this.seconds_left<=0) return;		
			
		this.seconds_left--;		
		objects.spgame_t_seconds.text=['Осталось времени: ','Time left: '][LANG]+this.format_time(this.seconds_left);		
		
		if (!common.move_on&&!this.seconds_left)
			this.show_fin_dialog('no_time');
			
		
	},
	
	get_num_of_color_balls(){		
		let n=0;
		for (let b=0;b<14;b++)
			if (objects.balls[b].on) n++;
		return n;		
	},
	
	init_level(){
		
		//сначала все отключаем
		objects.balls.forEach(b=>{b.on=0;b.visible=false});
		common.move_on=0;
		
		//ссылка на текущий уровень
		this.cur_level_data=this.levels_data[this.cur_level];
		
		objects.spgame_t_level.text=['Уровень: ','Level: '][LANG]+this.cur_level;
		//objects.spgame_t_shots_left.text='Осталось попыток: '+this.shots_left;
		
		//располагаем белый шар в центре
		const white_ball=objects.balls[15];
		white_ball.reset();
		white_ball.x=this.cur_level_data.board[0][0];
		white_ball.y=this.cur_level_data.board[0][1];
		white_ball.random_orientation();
		white_ball.on=1;
		white_ball.visible=true;	

		const type_to_desc={
			instruction:['Посмотрите инструкцию как играть','Shot the tutorial'],
			touch_only_blue:['Выполните один удар, который приведет к соударениям всех синих шаров, но не затронет красные шары','Make one shot that will result in collisions of all blue balls, while not touching any red balls'],
			touch_all:['Выполните удар, который приведет к соударениям всех шаров','Make contact with all balls on the table in a single shot'],
			pocket_blue_untouch_red:['Забейте все синие шары не трогая красные','Pocket all the blue balls without touching the red ones'],
			pocket_row:['Забивайте минимум один шар при каждом ударе','Pocket at least one ball on every shot'],
			pocket_after_hit:[`Забейте один цветной шар после ${this.cur_level_data.hits} соударений с бортом или другим шаром`,`Pocket one colored ball after ${this.cur_level_data.hits} rail or other ball contact`],
			pocket_double:['Забейте 2 цветных шара за один удар','Pocket 2 color balls in single shot'],
			pocket_all:['Забейте все шары','Pocket all balls'],
		}
						
		//остальные шары в соответствии с уровнями
		this.balls_in_puzzle=[];
		for (let i=1;i<this.cur_level_data.board.length;i++){
			
			const ball=objects.balls[i-1];
			ball.on=1;
			ball.alpha=1;
			ball.visible=true;
			ball.random_orientation();
			ball.reset();	
			ball.set_color(this.cur_level_data.board[i][2])
			ball.x=this.cur_level_data.board[i][0];
			ball.y=this.cur_level_data.board[i][1];
			ball.touched=0;
			this.balls_in_puzzle.push(ball);
		}			
		
		if (this.cur_level_data.type==='touch_all')
			this.balls_in_puzzle.forEach(b=>b.alpha=0.6);
			
		if (this.cur_level_data.type==='touch_only_blue')
			this.balls_in_puzzle.forEach(b=>{if(b.color==='blue')b.alpha=0.6});
		
		if (this.cur_level_data.type==='pocket_after_hit')
			this.balls_in_puzzle.forEach(b=>b.alpha=0.6);
		
		if (this.cur_level_data.type==='instruction'){
			objects.stick.sangle=objects.stick.angle=-50;
			objects.guide_orb.angle=objects.stick.angle;
			this.show_inst();
		}

		
		this.on=1;	
		
		//контроль времени
		this.timer=0;
		this.seconds_total=this.cur_level_data.sec;
		this.seconds_left=this.cur_level_data.sec;
		objects.spgame_t_seconds.text=['Осталось времени: ','Time left: '][LANG]+this.format_time(this.seconds_left);	
		this.timer=setInterval(()=>{this.tick()},1000);
		
		//контроль попыток
		this.attemps_left=this.cur_level_data.attemps;			
		objects.spgame_t_attemps.text=['Осталось попыток: ','Attempts remaining: '][LANG]+this.attemps_left;	
				
		my_turn=1;
		
		//показываем все элементы игры
		anim3.add(objects.board_stuff_cont,{y:[450,0,'linear'],alpha:[0,1,'linear']}, true, 0.5);
				
		//готовим ход
		this.prepare_next_move();		
		
		//общие параметры
		common.init();
	
		const desc=type_to_desc[this.cur_level_data.type][LANG];
		common.show_info(desc);
		
	},
	
	info_window_close_event(){
		if (this.info_window_resolver)
			this.info_window_resolver();
	},
	
	async show_inst(){
		
		app.stage.interactive=false;	
		objects.spgame_exit_btn.visible=false;
		
		//показываем направляющие
		common.show_helper2();		
		common.update_cue();
		
		//ждем закрытия окна
		await new Promise(resolve => {
			this.info_window_resolver=resolve		
		});
		
		objects.instr_hand.x=800;
		objects.instr_hand.y=450;
		objects.instr_hand.visible=true;
		objects.instr_hand.alpha=1;
		objects.instr_hand.scale_x=1;
		objects.instr_hand.texture=assets.hand_free;
		await anim3.add(objects.instr_hand,{x:[800, 400,'linear'],y:[450, 315,'linear']}, true, 1);
		await anim3.wait(0.5);
		objects.instr_hand.texture=assets.free_click;
		await anim3.wait(0.5);
		
		
		objects.just_line.visible=true;
		objects.just_line.x=430;
		objects.just_line.y=345;
		let dx=0;
		for (let x=400;x<596;x++){
			
			objects.instr_hand.x=x;
			
			const sign=Math.sign(dx);
			objects.stick.angle=objects.stick.sangle+sign*(dx*dx)*0.001;
			objects.guide_orb.angle=objects.stick.angle;
			objects.just_line.width=x-400;
			//показываем направляющие
			common.show_helper2();		
			common.update_cue();			
			
			dx++;			
			await new Promise(resolve => setTimeout(resolve, 10));				
		}
		
		await anim3.wait(0.5);
		
		objects.just_line.visible=false;
		objects.instr_hand.texture=assets.hand_free;
		
		await anim3.add(objects.instr_hand,{x:[599,810,'linear'],y:[315, 200,'linear'],scale_x:[1,-1,'linear']}, true, 1);
		await anim3.wait(0.5);
		objects.instr_hand.texture=assets.free_click;
		await anim3.wait(0.5);
		
		
		for (let y=200;y<320;y++){
			objects.instr_hand.y=y;
			objects.hit_level.y=objects.hit_level.sy+y-200;
			common.cue_power=1+(y-200)*0.1;
			common.update_cue();
			await new Promise(resolve => setTimeout(resolve, 10));		
		}
		
		await anim3.wait(0.5);
		objects.instr_hand.texture=assets.hand_free;
		common.cue_power=8;
		common.hit_down();
		anim3.add(objects.instr_hand,{alpha:[1,0,'linear'],x:[810,900,'linear']}, false, 1);
		
		app.stage.interactive=true;	
		objects.spgame_exit_btn.visible=true;
		
	},
	
	random_balls(){
		
		//сначала все отключаем
		objects.balls.forEach(b=>{b.on=0;b.visible=false});		
		
		
		//количество шаров в маленьком квадрате
		const num_of_balls=1;
		const _balls=[];
		
		
		//выбираем случайные расположения
		while(_balls.length<num_of_balls){
			
			const n_ball = {
				x: irnd(101+ball_class.BALL_RADIUS,399-ball_class.BALL_RADIUS),
				y: irnd(122+ball_class.BALL_RADIUS,266-ball_class.BALL_RADIUS)
			};
			
			//проверяем не пересекает ли этот шар уже существующие
			let valid=1;
			for (const ball of _balls){				
				const bx=ball.x-n_ball.x;
				const by=ball.y-n_ball.y;				
				const d=Math.sqrt(bx*bx+by*by);
				if (d<ball_class.BALL_DIAMETER+5){
					valid=0;
					break;						
				}		
			}
			
			if (valid) _balls.push(n_ball);				
		}	
		
		//центр доски
		const board_cx=400;
		const board_cy=267;
		
		//находим отражения в других квадратах		
		for (let i=0;i<num_of_balls;i++){
			
			//положение шаров в верхней левой стороне
			const fx=_balls[i].x;
			const fy=_balls[i].y;				
				
			//горизонтальное отражение				
			_balls.push({x: 2*board_cx-fx,y: fy});	
			
			//вертикальное отражение				
			_balls.push({x: fx,y: 2*board_cy-fy});	
			
			//гор. и  вер. отражение				
			_balls.push({x: 2*board_cx-fx,y: 2*board_cy-fy});					
			
		}		
		
		//располагаем белый шар в центре
		const white_ball=objects.balls[15];
		white_ball.reset();
		white_ball.x=board_cx;
		white_ball.y=board_cy;
		white_ball.random_orientation();
		white_ball.on=1;
		white_ball.visible=true;	
		
		
		for(let i=0;i<_balls.length;i++){
			
			const ball=objects.balls[i];
			ball.on=1;
			ball.visible=true;
			ball.random_orientation();
			ball.reset();	
			ball.x=_balls[i].x;
			ball.y=_balls[i].y;			
			
		}
		
	},
	
	close(){
	
		objects.spgame_cont.visible=false;
		objects.spfin_dlg_cont.visible=false;
				
		//оставнавливаем шары
		common.stop();
		clearInterval(this.timer);
		
		//показываем все элементы игры
		anim3.add(objects.hit_level_cont,{x:[objects.hit_level_cont.x, 800,'linear']}, false, 0.4);
		anim3.add(objects.board_stuff_cont,{y:[0,450,'linear']}, false, 0.5);
		this.on=0;
		
	},
	
	move_start_event(){
		
		if (!this.on) return;
		
		this.attemps_left--;
		objects.spgame_t_attemps.text=['Осталось попыток: ','Attempts remaining: '][LANG]+this.attemps_left;	


	},
	
	set_life(life){
		
		this.life=life;
		objects.life_balls.forEach(b=>b.visible=false);
		for(let i=0;i<this.life;i++)
			objects.life_balls[i].visible=true;
		
	},
	
	descrease_life(){

		this.set_life(this.life-1);
		
	},
	
	prepare_next_move(){
		

		objects.stick_direction.visible=true;
		objects.guide_orb.visible=true;		

		if (this.cur_level_data.type==='touch_all')
			this.balls_in_puzzle.forEach(b=>b.alpha=0.6);
			
		if (this.cur_level_data.type==='touch_only_blue')
			this.balls_in_puzzle.forEach(b=>{if(b.color==='blue')b.alpha=0.6});
		
		if (this.cur_level_data.type==='pocket_after_hit')
			this.balls_in_puzzle.forEach(b=>b.alpha=0.6);
		
		anim3.add(objects.stick,{alpha:[0,1,'flick']}, true, 0.5);
		anim3.add(objects.hit_level_cont,{x:[800, objects.hit_level_cont.sx,'linear']}, true, 0.4);
		sound.play('ready2');
	
	},
					
	ball_potted_event(ball,hole_data){
				
		if(!this.on) return;	
		
		//если белый шар залетел в лузу
		if (ball.id===15){			
		
			//восстанавливаем шар
			common.restore_ball(objects.balls[15]);
			
			//выбираем рандомную лузу но не ту в которую залетели
			const my_holes=holes.filter(function(h){return !(h[0]===hole_data[0]&&h[1]===hole_data[1])});
			const tar_hole=my_holes[irnd(0,4)];
			objects.balls[15].holes_check=0;
			objects.balls[15].x=tar_hole[0];
			objects.balls[15].y=tar_hole[1];
			objects.balls[15].set_dir(tar_hole[2],tar_hole[3]); 	
			
			return;
		}
								
		//показываем анимацию
		const orb=objects.anim_orbs.find(o=>o.visible===false);
		if (orb)
			orb.activate(hole_data[0],hole_data[1]);
		
		//добавляем шар с список попавших в лузу
		common.potted_balls.push(ball);
		common.potted_balls_total.push(ball);
				
		//добавляем на боковую панель
		for (let mball of objects.move_potted_balls){
			if (!mball.visible){
				mball.set_color(ball.color);
				mball.add_to_stat();
				break;
			}			
		}
				
		if (this.cur_level_data.type==='pocket_after_hit'){			
			const hits_to_win=this.cur_level_data.hits;			
			if (common.potted_balls.some(ball=>{return (ball.borders_hits_before_potted+ball.balls_hits_before_potted>hits_to_win)}) ){
				this.show_fin_dialog('win');				
				return;
			}	
		}
		
		if (this.cur_level_data.type==='pocket_all'){			
			
			if (common.potted_balls_total.length===this.balls_in_puzzle.length){
				this.show_fin_dialog('win');				
				return;
			}	
		}
		
		if (this.cur_level_data.type==='pocket_row'){			
			
			if (common.potted_balls_total.length===this.balls_in_puzzle.length){
				this.show_fin_dialog('win');				
				return;
			}	
		}

		if (this.cur_level_data.type==='instruction'){
			this.show_fin_dialog('win');				
			return;
		}
		

	},
	
	border_hit(ball){		
		if (this.cur_level_data.type==='pocket_after_hit'){			
			const ball_hits_num=ball.borders_hits_before_potted+ball.balls_hits_before_potted;						
			if (ball_hits_num>this.cur_level_data.hits)
				ball.alpha=1;
		}			
	},
	
	balls_touch_event(ball0,ball1){
		
		if(!this.on) return;
		
		if (this.cur_level_data.type==='pocket_blue_untouch_red')
			if (ball0.color==='red'||ball1.color==='red')
				this.show_fin_dialog('lose');			
		
		if (this.cur_level_data.type==='touch_only_blue'){
			
			if (ball0.color==='blue') ball0.alpha=1;
			if (ball1.color==='blue') ball1.alpha=1;
			
			if (ball0.color==='red'||ball1.color==='red')
				this.show_fin_dialog('lose');			
		}
			
		if (this.cur_level_data.type==='touch_all'){
			ball0.alpha=1;
			ball1.alpha=1;
			if (this.balls_in_puzzle.every(b=>b.balls_hits_before_potted))
				this.show_fin_dialog('win');				
		}		
	
		if (this.cur_level_data.type==='pocket_after_hit'){
			
			const ball0_hits_num=ball0.borders_hits_before_potted+ball0.balls_hits_before_potted;
			const ball1_hits_num=ball1.borders_hits_before_potted+ball1.balls_hits_before_potted;
						
			if (ball0_hits_num>this.cur_level_data.hits)
				ball0.alpha=1;
			
			if (ball1_hits_num>this.cur_level_data.hits)
				ball1.alpha=1;
		}	
		
		
	},
	
	move_finish_event(){
		
		if(!this.on) return;		
		
		
		if (this.cur_level_data.type==='touch_all'){	
		
			if (this.balls_in_puzzle.every(b=>b.balls_hits_before_potted)){
				this.show_fin_dialog('win');				
				return;
			}		
			
			if (this.balls_in_puzzle.some(b=>b.balls_hits_before_potted===0)){
				this.show_fin_dialog('lose');				
				return;
			}			
		}
		
		if (this.cur_level_data.type==='touch_only_blue'){	
			
			const blue_balls=this.balls_in_puzzle.filter(b=>{return b.color==='blue'})
			const any_touch=this.balls_in_puzzle.some(b=>b.balls_hits_before_potted);
			
			
			
			if (any_touch&&blue_balls.every(b=>b.balls_hits_before_potted)){
				this.show_fin_dialog('win');				
				return;
			}		
			
			if (any_touch&&blue_balls.some(b=>b.balls_hits_before_potted===0)){
				this.show_fin_dialog('lose');				
				return;
			}			
		}
						
		if (this.cur_level_data.type==='pocket_all'){
			
			if(common.potted_balls_total.length===this.cur_level_data.board.length-1){
				this.show_fin_dialog('win');
				return;
			}
		}
		
		if (this.cur_level_data.type==='pocket_double'){
			
			if (common.potted_balls.length>=2){
				this.show_fin_dialog('win');				
				return;
			}	

			if (this.get_num_of_color_balls()<2){
				this.show_fin_dialog('lose');				
				return;
			}				
		}
				
		if (this.cur_level_data.type==='pocket_row'){
			
			if (!common.potted_balls.length){
				this.show_fin_dialog('lose');				
				return;
			}	
			
			const balls_to_pocket_num=this.cur_level_data.board.length-1	
			if (common.potted_balls_total.length===balls_to_pocket_num){
				this.show_fin_dialog('win');				
				return;
			}				
		}	
				
		if (this.cur_level_data.type==='pocket_after_hit'){
			
			if ( common.potted_balls.some(ball=>{return ball.borders_hits_before_potted>=1}) ){
				this.show_fin_dialog('win');				
				return;
			}	

			if (!this.get_num_of_color_balls()){
				this.show_fin_dialog('lose');				
				return;
			}	
			
		}
				
		if (this.cur_level_data.type==='pocket_blue_untouch_red'){
											
			const blue_balls_num=this.cur_level_data.board.filter(b=>b[2]==='blue').length;				
			if (blue_balls_num===common.potted_balls_total.length){
				this.show_fin_dialog('win');				
				return;
			}	
			
		}	
								
		if (!this.attemps_left){
			this.show_fin_dialog('no_attemps');
			return;
		}
		
		if (!this.seconds_left){
			this.show_fin_dialog('no_time');
			return;
		}		

		//ход закончился начинаем новый
		this.prepare_next_move();
		common.reset_cue();		

	},
	
	async show_fin_dialog(result){
		
		clearInterval(this.timer);
		this.on=0;	
				
		objects.spfin_dlg_star0.visible=false;
		objects.spfin_dlg_star1.visible=false;
		objects.spfin_dlg_star2.visible=false;		
		
		objects.spfin_dlg_title0.text=['Информация!','Info!'][LANG];
		
		if (result==='no_time')
			objects.spfin_dlg_title1.text=['Время истекло!','No time left!'][LANG];	
		
		if (result==='no_attemps')
			objects.spfin_dlg_title1.text=['Закончились попытки!','No attemps left!'][LANG];
		
		if (result==='lose')
			objects.spfin_dlg_title1.text=['Задача не выполнена!!','Mission failed!'][LANG];	
		
		if (result==='win')
			objects.spfin_dlg_title1.text=['Задание выполнено!','Complete!'][LANG];
		
		await anim3.add(objects.spfin_dlg_cont,{alpha:[0,1,'linear'],y:[objects.spfin_dlg_cont.sy-30,objects.spfin_dlg_cont.sy,'linear']}, true, 0.25);
		
		
		if (result==='win'){
			
			let stars=1+Math.floor(3*this.seconds_left/this.seconds_total);
			
			
			sound.play('sp_win');			
			levels.save_stat(this.cur_level,stars);
			objects.spfin_dlg_action_btn.texture=assets.spfin_dlg_next_img;
			objects.spfin_dlg_action_btn.pointerdown=()=>{this.next_btn_down()};
						
			await anim3.add(objects.spfin_dlg_star0,{alpha:[0,1,'linear'],scale_xy:[0.666,1,'linear']}, true, 0.15);
			if(stars>1)
				await anim3.add(objects.spfin_dlg_star1,{alpha:[0,1,'linear'],scale_xy:[0.666,1,'linear']}, true, 0.15);
			if(stars>2)
				await anim3.add(objects.spfin_dlg_star2,{alpha:[0,1,'linear'],scale_xy:[0.666,1,'linear']}, true, 0.15);
			
		}else{
			sound.play('lose');
			objects.spfin_dlg_action_btn.texture=assets.spfin_dlg_replay_img;
			objects.spfin_dlg_action_btn.pointerdown=()=>{this.replay_btn_down()};
			return;			
		}

	


	},
		
	exit_btn_down(){
		
		if (anim3.any_on()){
			sound.play('locked');
			return
		};	
		//anim3.add(objects.spfin_cont,{alpha:[1,0]}, false, 0.25,'linear');
		
		sound.play('close_it');
		
		this.close();		
		main_menu.activate();
		
	},
	
	next_btn_down(){
		this.activate(this.cur_level+1);
		anim3.add(objects.spfin_dlg_cont,{alpha:[1,0,'linear']}, false, 0.25);
	},

	replay_btn_down(){
		this.activate(this.cur_level);
		anim3.add(objects.spfin_dlg_cont,{alpha:[1,0,'linear']}, false, 0.25);
	},
	
}

common={	
	
	mx:-1,
	my:-1,
	power:0,
	level:1,
	spower:0,
	move_on:0,
	potted_balls:[],
	potted_balls_total:[],	
	tapped_object:0,
	drag_on:0,
	cue_power:5,
	initial_draw_amount:100,

	init(){
		
		objects.bcg.texture=assets.lobby_bcg_img;
		
		//информация о забитых шарах
		this.potted_balls=[];
		this.potted_balls_total=[];
		
		//получем уровень кия из настроек
		this.initial_draw_amount=pref.get_draw_amount();
		
		this.reset_cue();
		
		objects.board.texture=assets['board'+my_data.board_id];
		
		//процессинг
		some_process.common=this.process.bind(common);	

		//обновляем кий
		this.set_cue_level(my_data.cue_id);
		
	},
		
	init_triangle(){
		
		//расстанавливаем по треугольнику и перемешиваем------------------------
		const tri_side=25;
		const x_step=tri_side*0.866
		const half_fize=tri_side*0.5;
		let ball_ind=0;		

		const s_balls=[1,2,3,4,5,6,8,9,10,11,12,13].sort(() => 500-online_game.get_random()%1000);
		s_balls.splice(4,0,14);
		s_balls.splice(10,0,0);
		s_balls.push(7);		

		for (let x=0;x<5;x++){
		const y_start=262-half_fize*x;
		for (let y=0;y<x+1;y++){	
			const ball=objects.balls[s_balls[ball_ind]];
			ball.x=r2(500+x*x_step);
			ball.y=r2(y_start+y*tri_side);
			ball.random_orientation();
			ball_ind++;
		}	
		}
		objects.balls.forEach(b=>b.reset());
		
	},

	set_cue_level(level){
		
		//получем уровень кия из настроек
		my_data.cue_id=level;//[1-7]
		this.initial_draw_amount=pref.get_draw_amount();
		this.show_helper2();		
		this.update_cue();
		
		//меняем текстуру кия
		const stick_texture=assets['cue'+my_data.cue_id];		
		objects.stick.texture=stick_texture;
		
		//готовим текстуру для бокового кия		
		const region = new PIXI.Rectangle(400, 0, 270, 60);
		const hit_level_texture=new PIXI.Texture(stick_texture.baseTexture, region, null, null, 2);
		objects.hit_level.texture=hit_level_texture;
		
	},

	async hit_down(){

		if(!objects.stick.visible) return;
		if (anim3.any_on()) return;
				
		sound.play('cue');

		const s=objects.stick;
		const b=objects.balls[15];
		await anim3.add(s,{x:[s.x,b.x,'linear'],y:[s.y,b.y,'linear']}, true, 0.05);
		
		const ang=objects.stick.rotation;
		const power=this.cue_power;		
		const dx=r2(Math.cos(ang)*power);
		const dy=r2(Math.sin(ang)*power);
		b.set_dir(dx,dy);
		
		objects.stick_direction.visible=false;
		anim3.add(objects.stick,{alpha:[1,0,'linear']}, false, 0.4);
		anim3.add(objects.guide_orb,{alpha:[1,0,'linear']}, false, 0.4);
		anim3.add(objects.hit_level_cont,{x:[objects.hit_level_cont.x, 800,'linear']}, false, 0.5);
		
		//уведомляем игру о начале ход
		online_game.move_start_event(dx,dy);
		sp_game.move_start_event();
				
		//заново объявляем
		this.potted_balls=[];
		this.first_ball_hited='';
		this.move_on=1;
		
		//проверяем белый шар
		objects.balls[15].holes_check=1;
		
		//обнуляем количество комбо
		objects.balls.forEach(b=>{
			b.borders_hits_before_potted=0;
			b.balls_hits_before_potted=0;
		});
		
		//убираем боковые шары
		objects.move_potted_balls.forEach(b=>b.visible=false);

	},
	
	async process_incoming_move(data){
		
		//если движение еще происходит то ждем пока оно не закончилось
		if (this.move_on){			
			await new Promise(resolve => setTimeout(resolve, 1000));
			this.process_incoming_move(data);
			return;
		}
		
		//обрабатываем на стороне 
		timer.stop();
		
		const white_ball=objects.balls[15];
		white_ball.set_dir(data.dx,data.dy);
		
		//заново объявляем
		this.potted_balls=[];
		this.first_ball_hited='';
		this.move_on=1;		
		
		//убираем боковые шары
		objects.move_potted_balls.forEach(b=>b.visible=false);
		
	},
	
	kick_back(cur_ball, tar_ball){
		
		const ball_diameter=ball_class.BALL_RADIUS*2;
		const ball_diameter_sq=ball_diameter*ball_diameter;
		
		const ray_len=1000.0;		
		const ray_len_sq=1000000.0;
		
		const d=Math.sqrt(cur_ball.dir.x*cur_ball.dir.x+cur_ball.dir.y*cur_ball.dir.y);
		
		
		const ray_dir_nx=cur_ball.dir.x/d;
		const ray_dir_ny=cur_ball.dir.y/d;
		
		const ray_dir_x=ray_dir_nx*ray_len;
		const ray_dir_y=ray_dir_ny*ray_len;		
				
		//находим точку проекции
		const cx=tar_ball.x-cur_ball.x;
		const cy=tar_ball.y-cur_ball.y;
		const dot=cx*ray_dir_x+cy*ray_dir_y;
		const proj_x=cur_ball.x+ray_dir_nx*dot*0.001;
		const proj_y=cur_ball.y+ray_dir_ny*dot*0.001;
		
		//находим вектор в направлении точки проекции
		let proj_dx=proj_x-tar_ball.x;
		let proj_dy=proj_y-tar_ball.y;
		const proj_d=Math.sqrt(proj_dx*proj_dx+proj_dy*proj_dy);
		
		//определяем насколько от точки проекции нужно отодвинуть движущийся шар
		const cor_dist=Math.sqrt(ball_diameter_sq-proj_d*proj_d)+0.0015;

		//отодвигаем движущийся шар назад
		cur_ball.x=r2(proj_x-ray_dir_nx*cor_dist);
		cur_ball.y=r2(proj_y-ray_dir_ny*cor_dist);
		
	},
	
	linelineColl(line_data,x3, y3, x4, y4){
		
		const x1=line_data[0];
		const y1=line_data[1];
		const x2=line_data[2];
		const y2=line_data[3];
		
		// calculate the distance to intersection point
		var uA = ((x4-x3)*(y1-y3) - (y4-y3)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1));
		var uB = ((x2-x1)*(y1-y3) - (y2-y1)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1));

		// if uA and uB are between 0-1, lines are colliding
		if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {
			const int_x = x1 + (uA * (x2-x1));
			const int_y = y1 + (uA * (y2-y1));
			return [int_x,int_y];
		}else{
			return [-1,-1];
		}

		
	},

	get_closest_point_on_borders(p1x,p1y,p2x,p2y){
						
		//ищем и запоминаем ближайшую точку от бордюров
		const nearest_point={x:p2x,y:p2y,d:999999};
			
		for (let i=0;i<all_borders.length;i++){
								
			const line_data=all_borders[i];
			
			const int_point=this.linelineColl(line_data,p1x,p1y,p2x,p2y);
			
			if (int_point[0]>-1){
				
				const dx=p1x-int_point[0];
				const dy=p1y-int_point[1];
				const ddd=Math.sqrt(dx*dx+dy*dy);
				if (ddd<nearest_point.d){							
					nearest_point.x=int_point[0];
					nearest_point.y=int_point[1];
					nearest_point.d=ddd;
				}						
			}									
		}		
		
		return nearest_point;
		
	},
	
	draw_run_with_check(ball0, ball1, length_to_draw){
		
		//только направление
		const pred_res=this.predict_hit(ball0,ball1);
		
		if (pred_res[0]){
			const ball_hit=pred_res[1];
			this.draw_run(ball0,ball_hit,length_to_draw);
			
		}else{
			const point=pred_res[1];
			
			//определяем на сколько можно провести линию
			const av_len=Math.min(point.d, length_to_draw);
			const tx_lim=ball0.x+ball0.dx*av_len;
			const ty_lim=ball0.y+ball0.dy*av_len;
			objects.stick_direction.moveTo(ball0.x, ball0.y);
			objects.stick_direction.lineTo(tx_lim, ty_lim);			
		}	
	},

	draw_run(ball0, ball1, length_to_draw){

		if (ball1){
			
			const dx=ball1.x-ball0.x;
			const dy=ball1.y-ball0.y;
			const dist_to_draw=Math.sqrt(dx*dx+dy*dy);
			
					
			if (dist_to_draw<length_to_draw){
				
				//рисуем направлени и сам шар в момент удара	
				objects.stick_direction.moveTo(ball0.x, ball0.y);
				objects.stick_direction.lineTo(ball1.x, ball1.y);			
				objects.stick_direction.drawCircle(ball1.x,ball1.y,ball_class.BALL_RADIUS);
				
				return dist_to_draw;
				
			}else{				
				
				//рисуем только линию сколько хватает
				const dxn=dx/dist_to_draw;
				const dyn=dy/dist_to_draw;
					
				const tx=ball0.x+dxn*length_to_draw;
				const ty=ball0.y+dyn*length_to_draw;
			
				objects.stick_direction.moveTo(ball0.x, ball0.y);
				objects.stick_direction.lineTo(tx, ty);	
				
				return length_to_draw;
				
			}

			
		} else {
			
			//только направление
			const tx=ball0.x+ball0.dx*1000.0;
			const ty=ball0.y+ball0.dy*1000.0;
			const point=this.get_closest_point_on_borders(ball0.x, ball0.y, tx, ty);
			
			//определяем на сколько можно провести линию
			const av_len=Math.min(point.d, length_to_draw);
			const tx_lim=ball0.x+ball0.dx*av_len;
			const ty_lim=ball0.y+ball0.dy*av_len;
			objects.stick_direction.moveTo(ball0.x, ball0.y);
			objects.stick_direction.lineTo(tx_lim, ty_lim);
			
			return av_len;
			
		}

	},

	show_helper2(){

		const wball=objects.balls[15];
		wball.dx=Math.cos(objects.stick.rotation);
		wball.dy=Math.sin(objects.stick.rotation);
		let run_res0,run_res1,run_res2;

		//запуск белого шара
		run_res0=this.predict_hit(wball);
		const run_res0_hit=run_res0[0];	
		const left_to_draw_top=this.initial_draw_amount;

		objects.stick_direction.clear();
		objects.stick_direction.alpha=0.5;		
		objects.stick_direction.lineStyle(1, 0xffffff)

		//point 1
		if (run_res0_hit){
			
			//шары в момент удара с ихними направлениями
			const ball0=run_res0[1]; // шар который запускают и он в месте коллизии
			const ball1=run_res0[2]; // шар об который стукаются			
									
			let draw_consumed1=this.draw_run(wball,ball0,left_to_draw_top);
			const left_to_draw=left_to_draw_top-draw_consumed1;
					
			//point 2
			if (my_data.cue_id>=2){
				
				//это запуск белого шара после первого столкновения
				run_res1=this.predict_hit(ball0,ball1);
				const run_res1_hit=run_res1[0];	
				if (run_res1_hit){
					
					const b0=run_res1[1]; // шар который запускают (его положение в месте коллизии)
					const b1=run_res1[2]; // шар об который стукаются
							
					const draw_consumed=this.draw_run(ball0,b0,left_to_draw);
					const left_to_draw1=left_to_draw-draw_consumed;
					
					//point 4
					if (my_data.cue_id>=4)
						this.draw_run_with_check(b0,b1,left_to_draw1);
					
					//point 5
					if (my_data.cue_id>=5)
						this.draw_run_with_check(b1,b0,left_to_draw1);					
						
				} else {				
					this.draw_run(ball0,0,left_to_draw);
				}				
								
			}

			
			//point 3			
			if (my_data.cue_id>=3) {
				
				//это запуск второго шара после первого столкновения
				run_res2=this.predict_hit(ball1,ball0);
				const run_res2_hit=run_res2[0];	
				if (run_res2_hit){
					
					const b0=run_res2[1]; // шар который запускают (его положение в месте коллизии)
					const b1=run_res2[2]; // шар об который стукаются
					
					const draw_consumed=this.draw_run(ball1,b0,left_to_draw);
					const left_to_draw2=left_to_draw-draw_consumed;
					
					//point 6
					if (my_data.cue_id>=6)
						this.draw_run_with_check(b0,b1,left_to_draw2);
					
					//point 7
					if(my_data.cue_id>=7)
						this.draw_run_with_check(b1,b0,left_to_draw2);
					
				} else {
					this.draw_run(ball1,0,left_to_draw);
				}					
			}						
		
		}else{			
			this.draw_run(wball,0,left_to_draw_top);			
		}
		
	},

	predict_hit(iball,no_check_ball){
	
		const start_ball={x:iball.x,y:iball.y,dx:iball.dx,dy:iball.dy,ball_hit_x:0,ball_hit_x:0};
		const tar_ball={x:0,y:0,dx:0,dy:0,ball_hit_x:0,ball_hit_x:0,dx:0,dy:0};

		const ray_len=1000.0;		
		const ray_len_sq=1000000.0;
				
		const ray_dir_x=start_ball.dx*ray_len;
		const ray_dir_y=start_ball.dy*ray_len;		
					
		const ball_diameter=ball_class.BALL_RADIUS*2;
		const ball_diameter_sq=ball_diameter*ball_diameter;
		
		let target_ball=0;
		let min_dist=9999999.0;
		
		//ищем пересечения с шарами
		for (let i=0;i<15;i++){
			
			const ball=objects.balls[i];
			if(!ball.on) continue;
			if(ball.x===iball.x&&ball.y===iball.y) continue;
			if(no_check_ball&&ball.x===no_check_ball.x&&ball.y===no_check_ball.y) continue;
			
			
			//находим точку проекции
			const cx=ball.x-start_ball.x;
			const cy=ball.y-start_ball.y;
			const dot=cx*ray_dir_x+cy*ray_dir_y;
			const proj_x=start_ball.x+start_ball.dx*dot*0.001;
			const proj_y=start_ball.y+start_ball.dy*dot*0.001;
			
			//проверяем что точка по курсу
			const dx=proj_x-start_ball.x;
			const dy=proj_y-start_ball.y;
			const flag=dx*ray_dir_x+dy*ray_dir_y;
			if (flag<0) continue;
			const d=Math.sqrt(dx*dx+dy*dy);
			
			//находим расстояние до точки проекции от стационарного шара
			const proj_dx=proj_x-ball.x;
			const proj_dy=proj_y-ball.y;
			const proj_d=Math.sqrt(proj_dx*proj_dx+proj_dy*proj_dy);
			
			//если шар далеко от линии движения беляка
			if (proj_d>ball_diameter) continue;
						
			//находим расстояние от точки проекции до точки где должен находится движ. шар в момент коллизии
			const dist_to_coll_point=Math.sqrt(ball_diameter_sq-proj_d*proj_d);
			
			//находим точку где бы находился беляк в момент столкновения
			const ball_hit_x=proj_x-start_ball.dx*dist_to_coll_point;
			const ball_hit_y=proj_y-start_ball.dy*dist_to_coll_point;
			
			//находимо точку столкновения
			const coll_x=(ball_hit_x+ball.x)*0.5;
			const coll_y=(ball_hit_y+ball.y)*0.5;
			
			//расстояние от беляка до его положения в месте столкновения
			const dx3=start_ball.x-ball_hit_x;
			const dy3=start_ball.y-ball_hit_y;
			const d3=Math.sqrt(dx3*dx3+dy3*dy3);

			
			if(d3<min_dist){				
				min_dist=d3;
				target_ball=ball;
				
				start_ball.ball_hit_x=ball_hit_x;
				start_ball.ball_hit_y=ball_hit_y;								
			}			
		}	
		
		//если шаров нет на пути
		if (!target_ball) {
			
			//никакой шар не пересекается ищем и запоминаем ближайшую точку от бордюров
			const nearest_point=this.get_closest_point_on_borders(start_ball.x,start_ball.y,start_ball.x+ray_dir_x,start_ball.y+ray_dir_y);
			return [0,nearest_point];			
			
		}	
		
		//теперь это уже белый шар который на месте столкновения
		start_ball.x=start_ball.ball_hit_x;
		start_ball.y=start_ball.ball_hit_y;
		 
		
		//находим пост направления шара который стукнули
		let dx2=target_ball.x-start_ball.x;
		let dy2=target_ball.y-start_ball.y;
		const d2=Math.sqrt(dx2*dx2+dy2*dy2);
		tar_ball.dx=dx2/d2;
		tar_ball.dy=dy2/d2;
		tar_ball.x=target_ball.x;
		tar_ball.y=target_ball.y;
	
		//пост направление беляка
		const nx=-dx2;
		const ny=-dy2;			
		const tval=nx*nx+ny*ny;			
		const dot4=start_ball.dx*nx+start_ball.dy*ny;			
		start_ball.dx=start_ball.dx-dot4*nx/tval;
		start_ball.dy=start_ball.dy-dot4*ny/tval;
		const d3=Math.sqrt(start_ball.dx*start_ball.dx+start_ball.dy*start_ball.dy);
		start_ball.dx=start_ball.dx/d3;
		start_ball.dy=start_ball.dy/d3;

		return [1,start_ball,tar_ball];		
	},

	restore_ball(ball){
		
		//находим свободное место
		for (let i=0;i<99999;i++){
			
			const px=online_game.get_random()%500+150;
			const py=online_game.get_random()%200+170;
			const min_d=common.get_distance_to_closest_ball(px,py);
			
			if (min_d>100){				
				ball.restore(py,px);
				return;
			}	
		}		
	},

	update_cue(){
		
		const s=objects.stick;
		const ang=s.rotation;
		const dx=Math.cos(ang);
		const dy=Math.sin(ang);
		s.x=s.sx-dx*this.cue_power*10;
		s.y=s.sy-dy*this.cue_power*10;
		
		this.show_helper2();
		
	},

	reset_cue(){
		
		//обновляем положение кия
		objects.stick.x=objects.stick.sx=objects.balls[15].x;
		objects.stick.y=objects.stick.sy=objects.balls[15].y;
		objects.guide_orb.x=objects.balls[15].x;
		objects.guide_orb.y=objects.balls[15].y;
		objects.stick.alpha=0.7;	

		//Обновляем уровень
		this.update_power_level(0);
		
	},

	border_hit(ball){		
		//console.log(ball.id);
	},

	is_obj_hited(mouse, obj){
		
		if (mouse.mx>obj.x+obj.width) return 0;
		if (mouse.mx<obj.x) return 0;
		if (mouse.my>obj.y+obj.height) return 0;
		if (mouse.my<obj.y) return 0;
		return 1
		
	},

	get_distance_to_closest_ball(x,y){
		
		let min_dist=999999;
		for (let i=0;i<objects.balls.length;i++){
			const ball=objects.balls[i];
			if(ball.visible){
				const dx=x-ball.x;
				const dy=y-ball.y;	
				const d=Math.sqrt(dx*dx+dy*dy);
				if (d<min_dist)
					min_dist=d;
			}
		}
		
		return min_dist;	
	},

	pointerdown(e){
		
		this.tapped_object='board';
		
		if(!objects.stick.visible) return;
		if(!online_game.on&&!sp_game.on) return;
		
		//определяем доска или уровень кликнули
		this.mx=e.data.global.x/app.stage.scale.x;
		this.my=e.data.global.y/app.stage.scale.y;		
	
		//определяем от какого объета считать драг
		this.tapped_object='';
		
		//если по доске тапнули
		if (this.is_obj_hited(this,objects.board)){
			this.tapped_object='board';			
			this.drag_on=1;			

			objects.stick.sangle=objects.stick.angle;
		}		
		
		//если по уровню тапнули
		if (this.is_obj_hited(this,objects.hit_level_cont)){
			this.tapped_object='hit_level';			
			this.drag_on=1;
		}
		
		this.update_cue();

	},

	pointermove(e){
		
		if(!objects.stick.visible) return;
				
		if(!this.drag_on) return;
		
		
		const cx=e.data.global.x/app.stage.scale.x;
		const cy=e.data.global.y/app.stage.scale.y;
		
		const dx=cx-this.mx;
		const dy=cy-this.my;
		
		if (this.tapped_object==='board'){
			
			const sign=Math.sign(dx);
			objects.stick.angle=objects.stick.sangle+sign*(dx*dx)*0.001;
			objects.guide_orb.angle=objects.stick.angle;
			
			//показываем направляющие
			this.show_helper2();		
			this.update_cue();
			
		}
		
		if (this.tapped_object==='hit_level'){			
			this.update_power_level(cy);
		}	
				
	},

	update_power_level(mouse_y){
		
		//сдвиг кия относительно начала
		let cue_shift=mouse_y-this.my;		

		//ограничиваем перемещение ползунка
		if (cue_shift>200) cue_shift=200;
		if (cue_shift<0) cue_shift=0;
		objects.hit_level.y=objects.hit_level.sy+cue_shift;
		
		//определяем мощность удара (от 1 до 10)
		this.cue_power=12*cue_shift/200+1;
		
		//обновляем положение кия
		this.update_cue();
	},

	pointerup(e){

		if(!objects.stick.visible) return;
		if(!online_game.on&&!sp_game.on) return;

		this.drag_on=0;

		this.px=-1;
		this.py=-1;
		objects.stick.spower=objects.stick.power;

		if (this.tapped_object==='hit_level')
			this.hit_down();

		this.tapped_object='';

	},

	run_balls(){
		
		//двигаем шары по направлению
		for (let ball of objects.balls)
			ball.process();
		
		//проверяем столкновения между шарами и если есть то обновляем направления
		for (let b=0;b<objects.balls.length-1;b++){
			
			const ball0=objects.balls[b];
			if (!ball0.on) continue;
			
			for (let b1=b+1;b1<objects.balls.length;b1++){
								
				const ball1=objects.balls[b1];	
				if (!ball1.on) continue;				
				
				let deltaX = ball0.x - ball1.x;
				let deltaY = ball0.y - ball1.y;
				const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

				//если есть столкновение
				if (distance<ball_class.BALL_DIAMETER){		
					
					//отмечаем первый шар
					if (!this.first_ball_hited){
						if (ball0.color==='white')
							this.first_ball_hited=ball1.color;
						else
							this.first_ball_hited=ball0.color;
						//console.log('Первый шар: ',this.first_ball_hited);
					}
					
					//звук столкновения если их не так много
					if (assets.balls_hit._instances.length<3){
						const max_spd=Math.max(ball0.speed,ball1.speed);
						sound.play('balls_hit',0,max_spd*0.1);						
					}
					
					ball0.holes_check=1;
					ball1.holes_check=1;
					
					//увеличиваем комбо
					ball0.balls_hits_before_potted++;
					ball1.balls_hits_before_potted++;
					
					const max_balls_hits=Math.max(ball0.balls_hits_before_potted,ball1.balls_hits_before_potted);
					ball0.balls_hits_before_potted=max_balls_hits;
					ball1.balls_hits_before_potted=max_balls_hits;
					
					const max_borders_hits=Math.max(ball0.borders_hits_before_potted,ball1.borders_hits_before_potted);
					ball0.borders_hits_before_potted=max_borders_hits;
					ball1.borders_hits_before_potted=max_borders_hits;				
					
					//сообщение в пазлы что произошло касание
					sp_game.balls_touch_event(ball0,ball1);
					
					//раздвигаем шары чтобы не было пересечения
					if ((ball0.speed===0 && ball1.speed!==0)|| (ball0.speed!==0 && ball1.speed===0)){
						//здесь по правилам чтобы движущийся шар вернулся на идеальную позицию
						if(ball0.speed>0)
							this.kick_back(ball0,ball1);
						else
							this.kick_back(ball1,ball0);						
					}else{
						//просто разводим шары 
						const overlap=Math.max(ball_class.BALL_DIAMETER-distance,0.0015);
						const rx=0.5*overlap*deltaX/distance
						const ry=0.5*overlap*deltaY/distance
						
						ball0.x=r2(ball0.x+rx);
						ball0.y=r2(ball0.y+ry);
						
						ball1.x=r2(ball1.x-rx);
						ball1.y=r2(ball1.y-ry);
					}
							
					//v1-v2 * https://en.wikipedia.org/wiki/Elastic_collision#Two-dimensional_collision_with_two_moving_objects
					const tvec1x=ball0.dir.x-ball1.dir.x;
					const tvec1y=ball0.dir.y-ball1.dir.y;
									
					//x1-x2
					deltaX = ball0.x - ball1.x;
					deltaY = ball0.y - ball1.y;
					const tvec2x=deltaX;
					const tvec2y=deltaY;
					
					// {v1-v2,x1-x2}
					const tval1=tvec1x*tvec2x+tvec1y*tvec2y;
					
					// ||x1-x2||^2
					const tval2=tvec2x*tvec2x+tvec2y*tvec2y;
							
					// {x1-x2,v1-v2} / ||x1-x2||^2
					const tval3=tval1/tval2
					
					//final0
					ball0.dir.x=ball0.dir.x-tval3*tvec2x;
					ball0.dir.y=ball0.dir.y-tval3*tvec2y;	
					ball0.recalc_speed();					
				
					//final1
					ball1.dir.x=ball1.dir.x+tval3*tvec2x;
					ball1.dir.y=ball1.dir.y+tval3*tvec2y;
					ball1.recalc_speed();						
				}			
			}		
		}	
		
		//console.log(objects.balls[15].x,objects.balls[15].y,objects.balls[15].dir);

		//двигаем шары по направлению
		for (let ball of objects.balls)
			ball.slow_down();
		
	},

	test_hit(b1x,b1y,b1dx,b1dy,b2x,b2y,b2dx,b2dy,wbx,wby,wbdx,wbdy){
				
		const ball0=objects.balls[0];
		const ball1=objects.balls[1];
		const white_ball=objects.balls[15];
		
		ball0.x=b1x;
		ball0.y=b1y;
		ball0.set_dir(b1dx,b1dy);
		ball0.on=1;
		
		
		ball1.x=b2x;
		ball1.y=b2y;
		ball1.on=1;	
		ball1.set_dir(b2dx,b2dy);
		
		//запускаем биток
		this.move_on=1;
		
		white_ball.x=wbx;
		white_ball.y=wby;
		white_ball.on=1;
		white_ball.set_dir(wbdx,wbdy);
	
		
	},

	stop(){
		
		this.move_on=0;
		objects.balls.forEach(b=>b.stop())
	},

	show_info(t){
		objects.t_help_info.text=t;
		anim3.add(objects.help_info_cont,{y:[600,objects.help_info_cont.sy,'easeOutBack']},true,0.25,false);	
		objects.info.text=t;
		sound.play('popup');
		
		clearTimeout(this.help_info_timer);
		this.help_info_timer=setTimeout(()=>{
			sp_game.info_window_close_event();
			anim3.add(objects.help_info_cont,{y:[objects.help_info_cont.sy,600,'easeInBack']},false,0.25,false);	
		},5000)
		
	},
	
	show_info_down(){		
		
		if (anim3.any_on()) {
			sound.play('locked');
			return
		};	
		
		
		sound.play('close_it');
		clearTimeout(this.help_info_timer);
		sp_game.info_window_close_event();
		anim3.add(objects.help_info_cont,{y:[objects.help_info_cont.sy,600,'easeInBack']},false,0.25,false);	
	},

	process(){
		
		if (!this.move_on) return;
		
		//двигаем шары
		this.run_balls();
		
		//проверяем что все шары остановлены
		const balls_stopped = objects.balls.every(b =>b.speed===0)&&(!anim3.any_on());
		if (balls_stopped){
			this.move_on=0;
			online_game.move_finish_event();
			sp_game.move_finish_event();
		}		
		
	}
	

}

anim_bcg={
	
	start(){
		
		objects.bcg_balls.forEach(b=>{
			b.visible=true;
			b.x=irnd(0,M_WIDTH);
			b.y=irnd(0,M_HEIGHT);
			b.random_orientation();
			b.reset();	
			b.speed=1;
			b.scale_xy=0.9;
			b.set_color('black');
			const rnd_ang=Math.random()*2*Math.PI;
			b.set_dir(Math.sin(rnd_ang),Math.cos(rnd_ang));
		});
		
		objects.bcg_balls_cont.visible=true;
		
		some_process.bcg_anim=function(){anim_bcg.process()};
		
	},
	
	process(){
		
		objects.bcg_balls.forEach(b=>b.move());
		
		//проверяем столкновения между шарами и если есть то обновляем направления
		for (let b=0;b<objects.bcg_balls.length-1;b++){
			
			const ball0=objects.bcg_balls[b];
			if (!ball0.on) continue;			
			
			for (let b1=b+1;b1<objects.bcg_balls.length;b1++){
								
				const ball1=objects.bcg_balls[b1];	
				if (!ball1.on) continue;				
				
				let deltaX = ball0.x - ball1.x;
				let deltaY = ball0.y - ball1.y;
				const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
				
				//если есть столкновение
				if (distance<bcg_ball_class.BALL_DIAMETER){		

					
									
					//раздвигаем шары чтобы не было пересечения
					if ((ball0.speed===0 && ball1.speed!==0)|| (ball0.speed!==0 && ball1.speed===0)){
						//здесь по правилам чтобы движущийся шар вернулся на идеальную позицию
						if(ball0.speed>0)
							common.kick_back(ball0,ball1);
						else
							common.kick_back(ball1,ball0);						
					}else{
						//просто разводим шары 
						const overlap=Math.min(bcg_ball_class.BALL_DIAMETER-distance,0.0015);
						const rx=0.5*overlap*deltaX/distance
						const ry=0.5*overlap*deltaY/distance
						
						ball0.x=r2(ball0.x+rx);
						ball0.y=r2(ball0.y+ry);
						
						ball1.x=r2(ball1.x-rx);
						ball1.y=r2(ball1.y-ry);
					}
							
					//v1-v2 * https://en.wikipedia.org/wiki/Elastic_collision#Two-dimensional_collision_with_two_moving_objects
					const tvec1x=ball0.dir.x-ball1.dir.x;
					const tvec1y=ball0.dir.y-ball1.dir.y;
									
					//x1-x2
					deltaX = ball0.x - ball1.x;
					deltaY = ball0.y - ball1.y;
					const tvec2x=deltaX;
					const tvec2y=deltaY;
					
					// {v1-v2,x1-x2}
					const tval1=tvec1x*tvec2x+tvec1y*tvec2y;
					
					// ||x1-x2||^2
					const tval2=tvec2x*tvec2x+tvec2y*tvec2y;
							
					// {x1-x2,v1-v2} / ||x1-x2||^2
					const tval3=tval1/tval2
					
					//final0
					ball0.dir.x=ball0.dir.x-tval3*tvec2x;
					ball0.dir.y=ball0.dir.y-tval3*tvec2y;	
					ball0.recalc_speed();					
				
					//final1
					ball1.dir.x=ball1.dir.x+tval3*tvec2x;
					ball1.dir.y=ball1.dir.y+tval3*tvec2y;
					ball1.recalc_speed();						
				}			
			}		
		}	
		
		
		
	}	
	
	
}

main_menu={

	async activate() {
		
		//проверяем и включаем музыку
		//music.activate();
		objects.main_menu_cont.visible=true;
				
		//vk
		//if (game_platform==='VK')
		//anim3.add(objects.vk_buttons_cont,{alpha:[0,1,'linear']}, true, 0.5);	
				
		objects.bcg.texture=assets.main_bcg_img;			
		anim3.add(objects.bcg,{alpha:[0,1,'linear']}, true, 0.5);			
	
		anim3.add(objects.title_cont,{alpha:[0,1,'linear']}, true, 0.5);	
		
		anim3.add(objects.bcg,{alpha:[0,1,'linear']}, true, 0.2);	
		
		anim3.add(objects.title_eko,{x:[-100,objects.title_eko.sx,'easeOutBack']}, true, 0.5);	
		anim3.add(objects.title_online,{x:[850,objects.title_online.sx,'easeOutBack']}, true, 0.5);	
		
		
		anim3.add(objects.title_rack,{x:[900,objects.title_rack.sx,'linear']}, true, 1);	
		anim3.add(objects.title_stick,{angle:[0,-15,'linear']}, true, 0.2);	
		
		//rotation: 2 * dx / D
		objects.anim_ball_1.x=-30;
		objects.anim_ball_2.x=820;
		objects.anim_ball_1.spd=5;
		objects.anim_ball_2.spd=-3;
		
	
		levels.load_stat();

		some_process.main_menu=this.process;
		//кнопки
		await anim3.add(objects.main_btn_cont,{x:[800,objects.main_btn_cont.sx,'linear'],alpha:[0,1,'linear']}, true, 0.75);	

	},
	
	process(){
		
		objects.main_title_blique.x+=20;
		if (objects.main_title_blique.x>2000)
			objects.main_title_blique.x=0;
		
		objects.title_rack.rotation=Math.sin(game_tick*0.04)*2;
		objects.title_stick.rotation=-0.256+Math.sin(game_tick*0.6)*0.1;
		
		const balls=[objects.anim_ball_1,objects.anim_ball_2];
			for (const ball of balls){
			if (ball.spd!=0){
				ball.x+=ball.spd;
				ball.rotation+=ball.spd/39.5;
				ball.spd*=0.98;
				if (ball.spd>0&&ball.spd<0.02)
					ball.spd=0;
				if (ball.spd<0&&ball.spd>-0.02)
					ball.spd=0;
			}		
		}

	},
	
	ball_touched(ball,D){
		
		if (anim3.any_on()) {
			sound.play('locked');
			return
		};
		
		const curx=ball.x;
		const cur_rot=ball.rotation;
		
		let tar_x=0;
		let tar_rot=0;
		
		if (curx>400){
			ball.spd=-irnd(1,7);
		}else{
			ball.spd=irnd(1,7);;
		}
		
	},
	
	async close() {
		
		//игровой титл
		
		//anim3.add(objects.bcg,{alpha:[1,0]}, false, 0.5,'linear');			
		
		anim3.add(objects.main_btn_cont,{x:[objects.main_btn_cont.x,-800,'linear']}, false, 0.5);	

		//кнопки
		anim3.add(objects.title_cont,{alpha:[1,0,'linear']}, false, 0.5);		
								
		objects.main_menu_cont.visible=false;		
		some_process.main_menu=function(){};		

	},

	async sp_btn_down () {

		if (anim3.any_on()) {
			sound.play('locked');
			return
		};

		sound.play('click');

		await this.close();
		levels.activate();
		//lobby.activate();

	},
	
	async online_btn_down () {

		if (anim3.any_on()) {
			sound.play('locked');
			return
		};

		if (!levels.stat||!levels.stat.length) {
			sys_msg.add('Пройдите туториал в одиночной игре для доступа')
			anim3.add(objects.sp_btn,{scale_xy:[0.666, 1,'ease2back'],angle:[0,10,'ease2back']}, true, 0.25);
			return
		};


		sound.play('click');

		await this.close();
		//levels.activate();
		lobby.activate();

	},

	async lb_btn_down() {

		if (anim3.any_on()===true) {
			sound.play('locked');
			return
		};

		sound.play('click');

		await this.close();
		lb.show();

	},

	instr_btn_down(){
		
		if (anim3.any_on()) {
			sound.play('locked');
			return
		};

		sound.play('click');
		
		this.close();	
		instr.activate();
		
	},

	pref_btn_down () {

		if (anim3.any_on()) {
			sound.play('locked');
			return
		};

		sound.play('click');
		
		this.close();	
		pref.activate();

	},

	rules_ok_down () {

		if (anim3.any_on()===true) {
			sound.play('locked');
			return
		};
		
		sound.play('close_it');

		anim3.add(objects.rules,{y:[objects.rules.sy, -450,'easeInBack']}, false, 0.5);

	},
	
	
}

lobby={
	
	state_tint :{},
	_opp_data : {},
	activated:false,
	rejected_invites:{},
	fb_cache:{},
	first_run:0,
	on:0,
	global_players:{},
	state_listener_on:0,
	state_listener_timeout:0,
		
	activate(room) {
		
		//первый запуск лобби
		if (!this.activated){			
			//расставляем по соответствующим координатам
			
			for(let i=0;i<objects.mini_cards.length;i++) {

				const iy=i%4;
				objects.mini_cards[i].y=50+iy*80;
			
				let ix;
				if (i>15) {
					ix=~~((i-16)/4)
					objects.mini_cards[i].x=815+ix*190;
				}else{
					ix=~~((i)/4)
					objects.mini_cards[i].x=15+ix*190;
				}
			}		

			this.activated=true;
			
		}
		
		
		objects.bcg.texture=assets.lobby_bcg_img;
		anim3.add(objects.bcg,{alpha:[0,1,'linear']}, true, 0.5);	
		anim3.add(objects.cards_cont,{alpha:[0, 1,'linear']}, true, 0.1);
		anim3.add(objects.lobby_footer_cont,{y:[450, objects.lobby_footer_cont.sy,'linear']}, true, 0.1);
		anim3.add(objects.lobby_header_cont,{y:[-50, objects.lobby_header_cont.sy,'linear']}, true, 0.1);
		objects.cards_cont.x=0;
		this.on=1;
		
		//отключаем все карточки
		for(let i=0;i<objects.mini_cards.length;i++)
			objects.mini_cards[i].visible=false;
				
		//процессинг
		some_process.lobby=function(){lobby.process()};

		//добавляем карточку бота если надо
		this.starting_card=0;
				
		//убираем старое и подписываемся на новую комнату
		if (room){			
			if(room_name){
				fbs.ref(room_name).off();
				fbs.ref(room_name+'/'+my_data.uid).remove();
				this.global_players={};
				this.state_listener_on=0;
			}
			room_name=room;
		}
				
		//удаляем таймаут слушателя комнаты
		clearTimeout(this.state_listener_timeout);
		
		this.players_list_updated(this.global_players);
		
		//включаем прослушивание если надо
		if (!this.state_listener_on){
			
			//console.log('Подключаем прослушивание...');
			fbs.ref(room_name).on('child_changed', snapshot => {	
				const val=snapshot.val()				
				//console.log('child_changed',snapshot.key,val,JSON.stringify(val).length)
				this.global_players[snapshot.key]=val;
				lobby.players_list_updated(this.global_players);
			});
			fbs.ref(room_name).on('child_added', snapshot => {			
				const val=snapshot.val()
				//console.log('child_added',snapshot.key,val,JSON.stringify(val).length)
				this.global_players[snapshot.key]=val;
				lobby.players_list_updated(this.global_players);
			});
			fbs.ref(room_name).on('child_removed', snapshot => {			
				const val=snapshot.val()
				//console.log('child_removed',snapshot.key,val,JSON.stringify(val).length)
				delete this.global_players[snapshot.key];
				lobby.players_list_updated(this.global_players);
			});
			
			fbs.ref(room_name+'/'+my_data.uid).onDisconnect().remove();	
			
			this.state_listener_on=1;						
		}

		set_state({state : 'o'});
		
		//создаем заголовки
		const room_desc=['КОМНАТА #','ROOM #'][LANG]+room_name.slice(6);
		objects.t_room_name.text=room_desc;				

	},
	
	pref_btn_down(){
		
		//если какая-то анимация
		if (anim3.any_on()) {
			sound.play('locked');
			return
		};
		
		sound.play('click');
		
		//подсветка
		objects.lobby_btn_hl.x=objects.lobby_pref_btn.x;
		objects.lobby_btn_hl.y=objects.lobby_pref_btn.y;
		anim3.add(objects.lobby_btn_hl,{alpha:[0,1,'ease3peaks']}, false, 0.25,false);	
		
		//убираем контейнер
		anim3.add(objects.cards_cont,{x:[objects.cards_cont.x,800,'linear']}, false, 0.2);
		
		
		//меняем футер
		anim3.add(objects.lobby_header_cont,{y:[objects.lobby_footer_cont.y,-100,'linear']}, false, 0.2);
		anim3.add(objects.lobby_footer_cont,{y:[objects.lobby_footer_cont.sy,450,'linear']}, true, 0.2);
		pref.activate();
		
	},

	players_list_updated(players) {
	
	
		//console.log('DATA:',JSON.stringify(data).length);
		//console.log(new Date(Date.now()).toLocaleTimeString());
		//если мы в игре то пока не обновляем карточки
		//if (state==='p'||state==='b')
		//	return;				

		//это столы
		let tables = {};
		
		//это свободные игроки
		let single = {};
		
		//удаляем инвалидных игроков
		for (let uid in players){	
			if(!players[uid].name||!players[uid].rating||!players[uid].state)
				delete players[uid];
		}

		//делаем дополнительный объект с игроками и расширяем id соперника
		let p_data = JSON.parse(JSON.stringify(players));
		
		//создаем массив свободных игроков и обновляем кэш
		for (let uid in players){	

			const player=players[uid];

			//обновляем кэш с первыми данными			
			players_cache.update(uid,{name:player.name,rating:player.rating,hidden:player.hidden});
			
			if (player.state!=='p'&&!player.hidden)
				single[uid] = player.name;						
		}
		
		//оставляем только тех кто за столом
		for (let uid in p_data)
			if (p_data[uid].state !== 'p')
				delete p_data[uid];		
		
		//дополняем полными ид оппонента
		for (let uid in p_data) {			
			const small_opp_id = p_data[uid].opp_id;			
			//проходимся по соперникам
			for (let uid2 in players) {	
				let s_id=uid2.substring(0,10);				
				if (small_opp_id === s_id) {
					//дополняем полным id
					p_data[uid].opp_id = uid2;
				}							
			}			
		}
		
		//определяем столы
		for (let uid in p_data) {
			const opp_id = p_data[uid].opp_id;		
			if (p_data[opp_id]) {				
				if (uid === p_data[opp_id].opp_id && !tables[uid]) {					
					tables[uid] = opp_id;					
					delete p_data[opp_id];				
				}				
			}		
		}							
					
		//считаем сколько одиночных игроков и сколько столов
		const num_of_single = Object.keys(single).length;
		const num_of_tables = Object.keys(tables).length;
		const num_of_cards = num_of_single + num_of_tables;
		
		//если карточек слишком много то убираем столы
		if (num_of_cards > objects.mini_cards.length) {
			const num_of_tables_cut = num_of_tables - (num_of_cards - objects.mini_cards.length);			
			const num_of_tables_to_cut = num_of_tables - num_of_tables_cut;
			
			//удаляем столы которые не помещаются
			const t_keys = Object.keys(tables);
			for (let i = 0 ; i < num_of_tables_to_cut ; i++) {
				delete tables[t_keys[i]];
			}
		}
		
		//убираем карточки пропавших игроков и обновляем карточки оставшихся
		for(let i=this.starting_card;i<objects.mini_cards.length;i++) {			
			if (objects.mini_cards[i].visible === true && objects.mini_cards[i].type === 'single') {				
				const card_uid = objects.mini_cards[i].uid;				
				if (single[card_uid] === undefined)					
					objects.mini_cards[i].visible = false;
				else
					this.update_existing_card({id:i, state:players[card_uid].state, rating:players[card_uid].rating, name:players[card_uid].name});
			}
		}
		
		//определяем новых игроков которых нужно добавить
		new_single = {};		
		
		for (let p in single) {
			
			let found = 0;
			for(let i=0;i<objects.mini_cards.length;i++) {			
			
				if (objects.mini_cards[i].visible === true && objects.mini_cards[i].type === 'single') {					
					if (p ===  objects.mini_cards[i].uid) {						
						found = 1;							
					}	
				}				
			}		
			
			if (found === 0)
				new_single[p] = single[p];
		}
				
		//убираем исчезнувшие столы (если их нет в новом перечне) и оставляем новые
		for(let i=this.starting_card;i<objects.mini_cards.length;i++) {			
		
			if (objects.mini_cards[i].visible && objects.mini_cards[i].type === 'table') {
				
				const uid1 = objects.mini_cards[i].uid1;	
				const uid2 = objects.mini_cards[i].uid2;	
				
				let found = 0;
				
				for (let t in tables) {					
					const t_uid1 = t;
					const t_uid2 = tables[t];									
					if (uid1 === t_uid1 && uid2 === t_uid2) {
						delete tables[t];
						found = 1;						
					}							
				}
								
				if (found === 0)
					objects.mini_cards[i].visible = false;
			}	
		}
				
		//размещаем на свободных ячейках новых игроков
		for (let uid in new_single)			
			this.place_new_card({uid, state:players[uid].state, name : players[uid].name,  rating : players[uid].rating});

		//размещаем НОВЫЕ столы где свободно
		for (let uid in tables) {			
			const name1=players[uid].name
			const name2=players[tables[uid]].name
			
			const rating1= players[uid].rating
			const rating2= players[tables[uid]].rating
			
			const game_id=players[uid].game_id;
			this.place_table({uid1:uid,uid2:tables[uid],name1, name2, rating1, rating2,game_id});
		}
		
	},

	add_card_ai() {
		
		const card=objects.mini_cards[0]
		
		//убираем элементы стола так как они не нужны
		card.rating_text1.visible = false;
		card.rating_text2.visible = false;
		card.avatar1.visible = false;
		card.avatar2.visible = false;
		card.avatar1_frame.visible = false;
		card.avatar2_frame.visible = false;
		card.table_rating_hl.visible = false;
		card.bcg.texture=assets.mini_player_card_ai;

		card.visible=true;
		card.uid='bot';
		card.name=card.name_text.text=['Бот','Bot'][LANG];

		card.rating=1400;		
		card.rating_text.text = card.rating;
		card.avatar.set_texture(assets.pc_icon);
		
		//также сразу включаем его в кэш
		if(!players_cache.players.bot){
			players_cache.players.bot={};
			players_cache.players.bot.name=['Бот','Bot'][LANG];
			players_cache.players.bot.rating=1400;
			players_cache.players.bot.texture=assets.pc_icon;			
		}
	},
	
	get_state_texture(s,uid) {
		
		switch(s) {

			case 'o':
				return assets.mini_player_card;
			break;

			case 'b':
				return assets.mini_player_card_bot;
			break;

			case 'p':
				return assets.mini_player_card;
			break;
			
			case 'b':
				return assets.mini_player_card;
			break;

		}
	},
	
	place_table(params={uid1:0,uid2:0,name1: 'X',name2:'X', rating1: 1400, rating2: 1400,game_id:0}) {
				
				
		for(let i=this.starting_card;i<objects.mini_cards.length;i++) {
			
			const card=objects.mini_cards[i];

			//это если есть вакантная карточка
			if (!card.visible) {

				//устанавливаем цвет карточки в зависимости от состояния
				card.bcg.texture=this.get_state_texture(params.state);
				card.state=params.state;

				card.type = "table";				
				
				card.bcg.texture = assets.mini_player_card_table;
				
				//присваиваем карточке данные
				//card.uid=params.uid;
				card.uid1=params.uid1;
				card.uid2=params.uid2;
												
				//убираем элементы свободного стола
				card.rating_text.visible = false;
				card.avatar.visible = false;
				card.avatar_frame.visible = false;
				card.avatar1_frame.visible = false;
				card.avatar2_frame.visible = false;
				card.name_text.visible = false;

				//Включаем элементы стола 
				card.table_rating_hl.visible=true;
				card.rating_text1.visible = true;
				card.rating_text2.visible = true;
				card.avatar1.visible = true;
				card.avatar2.visible = true;
				card.avatar1_frame.visible = true;
				card.avatar2_frame.visible = true;
				//card.rating_bcg.visible = true;

				card.rating_text1.text = params.rating1;
				card.rating_text2.text = params.rating2;
				
				card.name1 = params.name1;
				card.name2 = params.name2;

				//получаем аватар и загружаем его
				this.load_avatar2({uid:params.uid1, tar_obj:card.avatar1});
				
				//получаем аватар и загружаем его
				this.load_avatar2({uid:params.uid2, tar_obj:card.avatar2});


				card.visible=true;
				card.game_id=params.game_id;

				break;
			}
		}
		
	},

	update_existing_card(params={id:0, state:'o' , rating:1400, name:''}) {

		//устанавливаем цвет карточки в зависимости от состояния( аватар не поменялись)
		const card=objects.mini_cards[params.id];
		card.bcg.texture=this.get_state_texture(params.state,card.uid);
		card.state=params.state;

		card.name_text.set2(params.name,105);
		card.rating=params.rating;
		card.rating_text.text=params.rating;
		card.visible=true;
	},

	place_new_card(params={uid:0, state: 'o', name:'X ', rating: rating}) {

		for(let i=this.starting_card;i<objects.mini_cards.length;i++) {

			//ссылка на карточку
			const card=objects.mini_cards[i];

			//это если есть вакантная карточка
			if (!card.visible) {

				//устанавливаем цвет карточки в зависимости от состояния
				card.bcg.texture=this.get_state_texture(params.state,params.uid);
				card.state=params.state;

				card.type = 'single';
				
				//присваиваем карточке данные
				card.uid=params.uid;

				//убираем элементы стола так как они не нужны
				card.rating_text1.visible = false;
				card.rating_text2.visible = false;
				card.avatar1.visible = false;
				card.avatar2.visible = false;
				card.avatar1_frame.visible = false;
				card.avatar2_frame.visible = false;
				card.table_rating_hl.visible=false;
				
				//включаем элементы одиночной карточки
				card.rating_text.visible = true;
				card.avatar.visible = true;
				card.avatar_frame.visible = true;
				card.name_text.visible = true;

				card.name=params.name;
				card.name_text.set2(params.name,105);
				card.rating=params.rating;
				card.rating_text.text=params.rating;

				card.visible=true;


				//получаем аватар и загружаем его
				this.load_avatar2({uid:params.uid, tar_obj:card.avatar});

				//console.log(`новая карточка ${i} ${params.uid}`)
				return;
			}
		}

	},

	async load_avatar2 (params={}) {		
		
		//обновляем или загружаем аватарку
		await players_cache.update_avatar(params.uid);
		
		//устанавливаем если это еще та же карточка
		params.tar_obj.set_texture(players_cache.players[params.uid].texture);			
	},

	card_down(card_id) {
		
		if (objects.mini_cards[card_id].type === 'single')
			this.show_invite_dialog(card_id);
		
		if (objects.mini_cards[card_id].type === 'table')
			this.show_table_dialog(card_id);
				
	},
	
	show_table_dialog(card_id) {
					
		
		//если какая-то анимация или открыт диалог
		if (anim3.any_on() || pending_player!=='') {
			sound.play('locked');
			return
		};
		
		sound.play('click');
		//закрываем диалог стола если он открыт
		if(objects.invite_cont.visible) this.close_invite_dialog();
		
		anim3.add(objects.td_cont,{x:[800, objects.td_cont.sx,'linear']}, true, 0.1);
		
		const card=objects.mini_cards[card_id];
		
		objects.td_cont.card=card;
		
		objects.td_avatar1.set_texture(players_cache.players[card.uid1].texture);
		objects.td_avatar2.set_texture(players_cache.players[card.uid2].texture);
		
		objects.td_rating1.text = card.rating_text1.text;
		objects.td_rating2.text = card.rating_text2.text;
		
		objects.td_name1.set2(card.name1, 240);
		objects.td_name2.set2(card.name2, 240);
		
	},
	
	close_table_dialog() {
		sound.play('click');
		anim3.add(objects.td_cont,{x:[objects.td_cont.x, 800,'linear']}, false, 0.1);
	},

	show_invite_dialog(card_id) {

		//если какая-то анимация или уже сделали запрос
		if (anim3.any_on() || pending_player!=='') {
			sound.play('locked');
			return
		};		
				
		//закрываем диалог стола если он открыт
		if(objects.td_cont.visible) this.close_table_dialog();

		pending_player="";

		sound.play('click');			
		
		objects.invite_feedback.text = '';

		//показыаем кнопку приглашения
		objects.invite_button.texture=assets.invite_button;
	
		anim3.add(objects.invite_cont,{x:[800, objects.invite_cont.sx,'linear']}, true, 0.15);
		
		const card=objects.mini_cards[card_id];
		
		//копируем предварительные данные
		lobby._opp_data = {uid:card.uid,name:card.name,rating:card.rating};
			
		
		this.show_feedbacks(lobby._opp_data.uid);
		

		let invite_available=lobby._opp_data.uid !== my_data.uid;
		invite_available=invite_available && (card.state==="o" || card.state==="b");
		invite_available=invite_available || lobby._opp_data.uid==='bot';
		invite_available=invite_available && lobby._opp_data.rating >= 50 && my_data.rating >= 50;
		
		//на моей карточке показываем стастику
		if(lobby._opp_data.uid===my_data.uid){
			objects.invite_my_stat.text=[`Рейтинг: ${my_data.rating}\nИгры: ${my_data.games}`,`Rating: ${my_data.rating}\nGames: ${my_data.games}`][LANG]
			objects.invite_my_stat.visible=true;
		}else{
			objects.invite_my_stat.visible=false;
		}
		
		//кнопка удаления комментариев
		objects.fb_delete_button.visible=my_data.uid===lobby._opp_data.uid;
		
		//если мы в списке игроков которые нас недавно отврегли
		if (this.rejected_invites[lobby._opp_data.uid] && Date.now()-this.rejected_invites[lobby._opp_data.uid]<60000) invite_available=false;

		//показыаем кнопку приглашения только если это допустимо
		objects.invite_button.visible=invite_available;

		//заполняем карточу приглашения данными
		
		objects.invite_avatar.set_texture(players_cache.players[card.uid].texture);
		objects.invite_name.set2(lobby._opp_data.name,230);
		objects.invite_rating.text=card.rating_text.text;
				
	},
	
	fb_delete_down(){
		
		objects.fb_delete_button.visible=false;
		fbs.ref('fb/' + my_data.uid).remove();
		this.fb_cache[my_data.uid].fb_obj={0:[['***нет отзывов***','***no feedback***'][LANG],999,' ']};
		this.fb_cache[my_data.uid].tm=Date.now();
		objects.feedback_records.forEach(fb=>fb.visible=false);
		
		message.add(['Отзывы удалены','Feedbacks are removed'][LANG])
		
	},
	
	async show_invite_dialog_from_chat(uid,name) {

		//если какая-то анимация или уже сделали запрос
		if (anim3.any_on() || pending_player!=='') {
			sound.play('locked');
			return
		};		
				
		//закрываем диалог стола если он открыт
		if(objects.td_cont.visible) this.close_table_dialog();

		pending_player="";

		sound.play('click');			
		
		objects.invite_feedback.text = '';

		//показыаем кнопку приглашения
		objects.invite_button.texture=assets.invite_button;
	
		anim3.add(objects.invite_cont,{x:[800, objects.invite_cont.sx,'linear']}, true, 0.15);
		
		let player_data={uid};
		//await this.update_players_cache_data(uid);
					
		//копируем предварительные данные
		lobby._opp_data = {uid,name:players_cache.players[uid].name,rating:players_cache.players[uid].rating};
											
											
		//фидбэки												
		this.show_feedbacks(lobby._opp_data.uid);
		
		//кнопка удаления комментариев
		objects.fb_delete_button.visible=false;
		
		let invite_available = 	lobby._opp_data.uid !== my_data.uid;
		
		//если мы в списке игроков которые нас недавно отврегли
		if (this.rejected_invites[lobby._opp_data.uid] && Date.now()-this.rejected_invites[lobby._opp_data.uid]<60000) invite_available=false;

		//показыаем кнопку приглашения только если это допустимо
		objects.invite_button.visible=invite_available;

		//заполняем карточу приглашения данными
		objects.invite_avatar.set_texture(players_cache.players[uid].texture);
		objects.invite_name.set2(players_cache.players[uid].name,230);
		objects.invite_rating.text=players_cache.players[uid].rating;
	},

	async show_feedbacks(uid) {	


			
		//получаем фидбэки сначала из кэша, если их там нет или они слишком старые то загружаем из фб
		let fb_obj;		
		if (!this.fb_cache[uid] || (Date.now()-this.fb_cache[uid].tm)>120000) {
			let _fb = await fbs.ref("fb/" + uid).once('value');
			fb_obj =_fb.val();	
			
			//сохраняем в кэше отзывов
			this.fb_cache[uid]={};			
			this.fb_cache[uid].tm=Date.now();					
			if (fb_obj){
				this.fb_cache[uid].fb_obj=fb_obj;				
			}else{
				fb_obj={0:[['***нет отзывов***','***no feedback***'][LANG],999,' ']};
				this.fb_cache[uid].fb_obj=fb_obj;				
			}

			//console.log('загрузили фидбэки в кэш')				
			
		} else {
			fb_obj =this.fb_cache[uid].fb_obj;	
			//console.log('фидбэки из кэша ,ура')
		}

		
		
		var fb = Object.keys(fb_obj).map((key) => [fb_obj[key][0],fb_obj[key][1],fb_obj[key][2]]);
		
		//сортируем отзывы по дате
		fb.sort(function(a,b) {
			return b[1]-a[1]
		});	
	
		
		//сначала убираем все фидбэки
		objects.feedback_records.forEach(fb=>fb.visible=false)

		let prv_fb_bottom=0;
		const fb_cnt=Math.min(fb.length,objects.feedback_records.length);
		for (let i = 0 ; i < fb_cnt;i++) {
			const fb_place=objects.feedback_records[i];
			
			let sender_name =  fb[i][2] || 'Неизв.';
			if (sender_name.length > 10) sender_name = sender_name.substring(0, 10);		
			fb_place.set(sender_name,fb[i][0]);
			
			
			const fb_height=fb_place.text.textHeight*0.85;
			const fb_end=prv_fb_bottom+fb_height;
			
			//если отзыв будет выходить за экран то больше ничего не отображаем
			const fb_end_abs=fb_end+objects.invite_cont.y+objects.invite_feedback.y;
			if (fb_end_abs>450) return;
			
			fb_place.visible=true;
			fb_place.y=prv_fb_bottom;
			prv_fb_bottom+=fb_height;
		}
	
	},

	async close() {

		if (objects.invite_cont.visible === true)
			this.close_invite_dialog();
		
		if (objects.td_cont.visible === true)
			this.close_table_dialog();
		
		some_process.lobby=function(){};
		
		if (objects.pref_cont.visible)
			pref.close();
		

		//плавно все убираем
		anim3.add(objects.cards_cont,{alpha:[1, 0,'linear']}, false, 0.1);
		anim3.add(objects.lobby_footer_cont,{y:[ objects.lobby_footer_cont.y,450,'linear']}, false, 0.2);
		anim3.add(objects.lobby_header_cont,{y:[objects.lobby_header_cont.y,-50,'linear']}, false, 0.2);
		
		//больше ни ждем ответ ни от кого
		pending_player='';
		this.on=0;
		
		//отписываемся от изменений состояний пользователей через 30 секунд
		this.state_listener_timeout=setTimeout(()=>{
			fbs.ref(room_name).off();
			this.state_listener_on=0;
			//console.log('Отключаем прослушивание...');
		},30000);

	},
	
	async inst_message(data){
		
		//когда ничего не видно не принимаем сообщения
		if(!objects.cards_cont.visible) return;		

		await players_cache.update(data.uid);
		await players_cache.update_avatar(data.uid);		
		
		sound.play('inst_msg');		
		anim3.add(objects.inst_msg_cont,{alpha:[0,1,'linear']},true,0.4,false);		
		objects.inst_msg_avatar.texture=players_cache.players[data.uid].texture||PIXI.Texture.WHITE;
		objects.inst_msg_text.set2(data.msg,290);
		objects.inst_msg_cont.tm=Date.now();
	},
	
	get_room_index_from_rating(){		
		//номер комнаты в зависимости от рейтинга игрока
		const rooms_bins=[0,1366,1437,1580,9999];
		let room_to_go='state1';
		for (let i=1;i<rooms_bins.length;i++){
			const f=rooms_bins[i-1];
			const t=rooms_bins[i];		
			if (my_data.rating>f&&my_data.rating<=t)
				return i;
		}				
		return 1;
		
	},
	
	process(){
		
		const tm=Date.now();
		if (objects.inst_msg_cont.visible&&objects.inst_msg_cont.ready)
			if (tm>objects.inst_msg_cont.tm+7000)
				anim3.add(objects.inst_msg_cont,{alpha:[1, 0,'linear']},false,0.4);

	},
	
	peek_down(){
		
		if (anim3.any_on()) {
			sound.play('locked');
			return
		};
		sound.play('click');
		this.close();	
		
		//активируем просмотр игры
		game_watching.activate(objects.td_cont.card);
	},
	
	wheel_event(dir) {
		
	},
	
	async fb_my_down() {
		
		
		if (this._opp_data.uid !== my_data.uid || objects.feedback_cont.visible === true)
			return;
		
		let fb = await feedback.show(this._opp_data.uid);
		
		//перезагружаем отзывы если добавили один
		if (fb[0] === 'sent') {
			let fb_id = irnd(0,50);			
			await fbs.ref("fb/"+this._opp_data.uid+"/"+fb_id).set([fb[1], firebase.database.ServerValue.TIMESTAMP, my_data.name]);
			this.show_feedbacks(this._opp_data.uid);			
		}
		
	},

	close_invite_dialog() {

		sound.play('click');	

		if (!objects.invite_cont.visible) return;		

		//отправляем сообщение что мы уже не заинтересованы в игре
		if (pending_player!=='') {
			fbs.ref("inbox/"+pending_player).set({sender:my_data.uid,message:"INV_REM",tm:Date.now()});
			pending_player='';
		}

		anim3.add(objects.invite_cont,{x:[objects.invite_cont.x, 800,'linear']}, false, 0.15);
	},

	async send_invite() {


		if (!objects.invite_cont.ready||!objects.invite_cont.visible||objects.invite_button.texture===assets.invite_wait_img){
			sound.play('locked');
			return
		};

		if (anim3.any_on()){
			sound.play('locked');
			return
		};
		

		if (lobby._opp_data.uid==='bot')
		{
			await this.close();	

			opp_data.name=['Бот','Bot'][LANG];
			opp_data.uid='bot';
			opp_data.rating=1400;
			game.activate(bot_game, 'master');
		} else {
			sound.play('click');
			objects.invite_button.texture=assets.invite_wait_img;
			fbs.ref('inbox/'+lobby._opp_data.uid).set({sender:my_data.uid,message:'INV',tm:Date.now()});
			pending_player=lobby._opp_data.uid;

		}

	},

	rejected_invite(msg) {

		this.rejected_invites[pending_player]=Date.now();
		pending_player="";
		lobby._opp_data={};
		this.close_invite_dialog();
		if(msg==='REJECT_ALL')
			big_message.show(['Соперник пока не принимает приглашения.','The opponent refused to play.'][LANG],'---');
		else
			big_message.show(['Соперник отказался от игры. Повторить приглашение можно через 1 минуту.','The opponent refused to play. You can repeat the invitation in 1 minute'][LANG],'---');

	},

	async accepted_invite(seed) {


		//убираем запрос на игру если он открыт
		req_dialog.hide();
		
		//устанаваем окончательные данные оппонента
		opp_data=lobby._opp_data;
		
		//закрываем меню и начинаем игру
		await lobby.close();
		online_game.activate(seed,0);
		//game2.activate('master');

		
	},

	chat_btn_down(){
		if (anim3.any_on()) {
			sound.play('locked');
			return
		};
		
		sound.play('click');
		
		//подсветка
		objects.lobby_btn_hl.x=objects.lobby_chat_btn.x;
		objects.lobby_btn_hl.y=objects.lobby_chat_btn.y;
		anim3.add(objects.lobby_btn_hl,{alpha:[0,1,'ease3peaks']}, false, 0.25,false);	
		
		this.close();
		chat.activate();
		
	},

	quiz_btn_down(){
		
		if (anim3.any_on()) {
			sound.play('locked');
			return
		};		
		
		//sound.play('locked');
		//return
					
		sound.play('click');	
				
		//подсветка
		objects.lobby_btn_hl.x=objects.lobby_quiz_btn.x;
		objects.lobby_btn_hl.y=objects.lobby_quiz_btn.y;
		anim3.add(objects.lobby_btn_hl,{alpha:[0,1,'ease3peaks']}, false, 0.25,false);	
		
		this.close();
		quiz.activate();
	},

	async lb_btn_down() {

		if (anim3.any_on()===true) {
			sound.play('locked');
			return
		};

		sound.play('click');

		//подсветка
		objects.lobby_btn_hl.x=objects.lobby_lb_btn.x;
		objects.lobby_btn_hl.y=objects.lobby_lb_btn.y;
		anim3.add(objects.lobby_btn_hl,{alpha:[0,1,'ease3peaks']}, false, 0.25,false);	


		await this.close();
		lb.show();
	},
	
	list_btn_down(dir){
		
		if (anim3.any_on()===true) {
			sound.play('locked');
			return
		};
		
		sound.play('click');
		const cur_x=objects.cards_cont.x;
		const new_x=cur_x-dir*800;
		
		
		//подсветка
		const tar_btn={'-1':objects.lobby_left_btn,'1':objects.lobby_right_btn}[dir];
		objects.lobby_btn_hl.x=tar_btn.x;
		objects.lobby_btn_hl.y=tar_btn.y;
		anim3.add(objects.lobby_btn_hl,{alpha:[0,1,'ease3peaks']}, false, 0.25,false);	
		
		
		if (new_x>0 || new_x<-800) {
			sound.play('locked');
			return
		}
		
		anim3.add(objects.cards_cont,{x:[cur_x, new_x,'easeInOutCubic']},true,0.2);
	},

	async back_btn_down() {

		if (anim3.any_on()===true) {
			sound.play('locked');
			return
		};

		sound.play('click');

		await this.close();
		main_menu.activate();

	},

	info_btn_down(){
		
		if (anim3.any_on()) {
			sound.play('locked');
			return
		};
		sound.play('click');
		
		if(!objects.info_cont.init){
			
			objects.info_records[0].set({uid:'bot',name:'Админ',msg:'Новое правило - рейтинг игроков, неактивных более 5 дней, будет снижен до 2000.',tm:1734959027520})
			objects.info_records[0].scale_xy=1.2;
			objects.info_records[0].y=145;
			
			objects.info_records[1].set({uid:'bot',name:'Админ',msg:'Новое правило - не авторизованным игрокам не доступен рейтинг более 2000.',tm:1734959227520})
			objects.info_records[1].scale_xy=1.2;
			objects.info_records[1].y=235;
			
			objects.info_cont.init=1;
		}
		
		anim3.add(objects.info_cont,{alpha:[0,1,'linear']}, true, 0.25);

	},
	
	info_close_down(){
		
		if (anim3.any_on()) {
			sound.play('locked');
			return
		};
		sound.play('close');
		
		anim3.add(objects.info_cont,{alpha:[1,0,'linear']}, false, 0.25);
		
	}

}

lb={

	cards_pos: [[370,10],[380,70],[390,130],[380,190],[360,250],[330,310],[290,370]],
	last_update:0,

	show() {

		objects.bcg.texture=assets.lb_bcg;
		anim3.add(objects.bcg,{alpha:[0,1,'linear']}, true, 0.5);
		
		anim3.add(objects.lb_1_cont,{x:[-150, objects.lb_1_cont.sx,'easeOutBack']}, true, 0.5);
		anim3.add(objects.lb_2_cont,{x:[-150, objects.lb_2_cont.sx,'easeOutBack']}, true, 0.5);
		anim3.add(objects.lb_3_cont,{x:[-150, objects.lb_3_cont.sx,'easeOutBack']}, true, 0.5);
		anim3.add(objects.lb_cards_cont,{x:[450, 0,'easeOutCubic']}, true, 0.5);
				
		objects.lb_cards_cont.visible=true;
		
		anim3.add(objects.lb_back_btn,{y:[450, objects.lb_back_btn.sy,'linear']}, true, 0.25);

		for (let i=0;i<7;i++) {
			objects.lb_cards[i].x=this.cards_pos[i][0];
			objects.lb_cards[i].y=this.cards_pos[i][1];
			objects.lb_cards[i].place.text=(i+4)+".";

		}

		if (Date.now()-this.last_update>120000){
			this.update();
			this.last_update=Date.now();
		}


	},

	close() {

		objects.bcg.texture=assets.bcg;
		objects.lb_1_cont.visible=false;
		objects.lb_2_cont.visible=false;
		objects.lb_3_cont.visible=false;
		objects.lb_cards_cont.visible=false;
		objects.lb_back_btn.visible=false;

	},

	back_btn_down() {

		if (anim3.any_on()===true) {
			sound.play('locked');
			return
		};


		sound.play('close_it');
		this.close();
		lobby.activate();

	},

	async update() {

		let leaders=await fbs.ref('players').orderByChild('rating').limitToLast(20).once('value');
		leaders=leaders.val();

		const top={
			0:{t_name:objects.lb_1_name,t_rating:objects.lb_1_rating,avatar:objects.lb_1_avatar},
			1:{t_name:objects.lb_2_name,t_rating:objects.lb_2_rating,avatar:objects.lb_2_avatar},
			2:{t_name:objects.lb_3_name,t_rating:objects.lb_3_rating,avatar:objects.lb_3_avatar},			
		}
		
		for (let i=0;i<7;i++){	
			top[i+3]={};
			top[i+3].t_name=objects.lb_cards[i].name;
			top[i+3].t_rating=objects.lb_cards[i].rating;
			top[i+3].avatar=objects.lb_cards[i].avatar;
		}		
		
		//создаем сортированный массив лидеров
		const leaders_array=[];
		Object.keys(leaders).forEach(uid => {
			
			const leader_data=leaders[uid];
			const leader_params={uid,name:leader_data.name, rating:leader_data.rating, pic_url:leader_data.pic_url};
			leaders_array.push(leader_params);
			
			//добавляем в кэш
			players_cache.update(uid,leader_params);			
		});
		
		//сортируем....
		leaders_array.sort(function(a,b) {return b.rating - a.rating});
				
		//заполняем имя и рейтинг
		for (let place in top){
			const target=top[place];
			const leader=leaders_array[place];
			target.t_name.set2(leader.name||'',place>2?190:130);
			target.t_rating.text=leader.rating;			
		}
		
		//заполняем аватар
		for (let place in top){			
			const target=top[place];
			const leader=leaders_array[place];
			await players_cache.update_avatar(leader.uid);			
			target.avatar.texture=players_cache.players[leader.uid].texture;
		}
	
	}

}

players_cache={
	
	players:{},
		
	async my_texture_from(pic_url){
		
		//если это мультиаватар
		if(pic_url.includes('mavatar')) pic_url=multiavatar(pic_url);
	
		try{
			const texture = await PIXI.Texture.fromURL(pic_url);	
			return texture;
		}catch(er){
			return PIXI.Texture.WHITE;
		}

	},
	
	async update(uid,params={}){
				
		//если игрока нет в кэше то создаем его
		if (!this.players[uid]) this.players[uid]={}
							
		//ссылка на игрока
		const player=this.players[uid];
		
		//заполняем параметры которые дали
		for (let param in params) player[param]=params[param];
		
		if (!player.name) player.name=await fbs_once('players/'+uid+'/name');
		if (!player.rating) player.rating=await fbs_once('players/'+uid+'/rating');
	
		//извлекаем страну если она есть в отдельную категорию и из имени убираем
		const country =auth2.get_country_from_name(player.name);
		if (country){			
			player.country=country;
			player.name=player.name.slice(0, -4);
		}
	
	},
	
	async update_avatar(uid){
		
		const player=this.players[uid];
		if(!player) alert('Не загружены базовые параметры '+uid);
		
		//если текстура уже есть
		if (player.texture) return;
		
		//если нет URL
		if (!player.pic_url) player.pic_url=await fbs_once('players/'+uid+'/pic_url');
		
		if(player.pic_url==='https://vk.com/images/camera_100.png')
			player.pic_url='https://akukamil.github.io/domino/vk_icon.png';
				
		//загружаем и записываем текстуру
		if (player.pic_url) player.texture=await this.my_texture_from(player.pic_url);		
		
	},
	
	async update_avatar_forced(uid, pic_url){
		
		const player=this.players[uid];
		if(!player) alert('Не загружены базовые параметры '+uid);
						
		if(pic_url==='https://vk.com/images/camera_100.png')
			pic_url='https://akukamil.github.io/domino/vk_icon.png';
				
		//сохраняем
		player.pic_url=pic_url;
		
		//загружаем и записываем текстуру
		if (player.pic_url) player.texture=await this.my_texture_from(player.pic_url);	
		
	},
	
}

keep_alive = function() {

	fbs.ref('players/'+my_data.uid+'/tm').set(firebase.database.ServerValue.TIMESTAMP);
	fbs.ref('inbox/'+my_data.uid).onDisconnect().remove();
	fbs.ref(room_name+"/"+my_data.uid).onDisconnect().remove();

	set_state({});
}

function kill_game () {	
	firebase.app().delete();
	document.body.innerHTML = 'CLIENT TURN OFF';
}

main_loader={
	
	preload_assets:0,
	
	spritesheet_to_tex(t,xframes,yframes,total_w,total_h,xoffset,yoffset){
		

		const frame_width=xframes?total_w/xframes:0;
		const frame_height=yframes?total_h/yframes:0;
		
		const textures=[];
		for (let y=0;y<yframes;y++){
			for (let x=0;x<xframes;x++){
				
				const rect = new PIXI.Rectangle(xoffset+x*frame_width, yoffset+y*frame_height, frame_width, frame_height);
				const quadTexture = new PIXI.Texture(t.baseTexture, rect);
				textures.push(quadTexture);
			}
		}
		return textures;		
	},
	
	async load1(){			
		
		
		const loader=new PIXI.Loader();		
		
		//добавляем текстуры из листа загрузки
		loader.add('load_bar_bcg', git_src+'res/'+'common/load_bar_bcg.png');
		loader.add('load_bar_progress', git_src+'res/'+'common/load_bar_progress.png');
		loader.add('mfont2',git_src+'/fonts/core_sans_ds/font.fnt');
		loader.add('main_load_list',git_src+'/load_list.txt');

		//переносим все в ассеты
		await new Promise(res=>loader.load(res))
		for (const res_name in loader.resources){
			const res=loader.resources[res_name];			
			assets[res_name]=res.texture||res.sound||res.data;			
		}		
				
		const load_bar_bcg=new PIXI.Sprite(assets.load_bar_bcg);
		load_bar_bcg.x=170;
		load_bar_bcg.y=170;
		load_bar_bcg.width=450;
		load_bar_bcg.height=70;
				
		this.load_bar_mask=new PIXI.Graphics();
		this.load_bar_mask.beginFill(0xff0000);
		this.load_bar_mask.drawRect(0,0,1,40);
		this.load_bar_mask.x=190;
		this.load_bar_mask.y=200;		
				
		const load_bar_progress=new PIXI.Sprite(assets.load_bar_progress);
		load_bar_progress.x=170;
		load_bar_progress.y=200;
		load_bar_progress.width=450;
		load_bar_progress.height=40;
		load_bar_progress.mask=this.load_bar_mask
		
		this.t_progress=new PIXI.BitmapText('', {fontName: 'mfont',fontSize: 18,align: 'center'});
		this.t_progress.y=225;
		this.t_progress.x=600;		
		this.t_progress.tint=0xFFC000;
		this.t_progress.anchor.set(1,0);
		
		this.t_info=new PIXI.BitmapText(['Загрузка...','Loading...'][LANG], {fontName: 'mfont',fontSize: 20,align: 'center'});
		this.t_info.y=195;
		this.t_info.x=395;		
		this.t_info.tint=0xFFC000;
		this.t_info.anchor.set(0.5,0.5);
		
		objects.load_cont=new PIXI.Container();
		objects.load_cont.pivot.x=M_WIDTH*0.5
		objects.load_cont.pivot.y=M_HEIGHT*0.5
		objects.load_cont.x=M_WIDTH*0.5
		objects.load_cont.y=M_HEIGHT*0.5
		objects.load_cont.addChild(load_bar_bcg,load_bar_progress,this.load_bar_mask,this.t_info,this.t_progress)
		app.stage.addChild(objects.load_cont);
		
	},
	
	async load2(){
		
		//подпапка с ресурсами
		const lang_pack = ['RUS','ENG'][LANG];	
		
		const bundle=[];
		
		const loader=new PIXI.Loader();	
		
		//добавляем текстуры стикеров
		for (var i=0;i<16;i++)
			loader.add('sticker_texture_'+i, git_src+'stickers/'+i+'.png');
					
		//добавляем из основного листа загрузки
		const load_list=eval(assets.main_load_list);
		for (let i = 0; i < load_list.length; i++)
			if (load_list[i].class==='sprite' || load_list[i].class==='image')
				loader.add(load_list[i].name, git_src+'res/'+lang_pack + '/' + load_list[i].name + "." +  load_list[i].image_format);

		loader.add('click',git_src+'sounds/click.mp3');
		loader.add('close_it',git_src+'sounds/close_it.mp3');
		loader.add('cue',git_src+'sounds/cue.mp3');
		loader.add('balls_hit',git_src+'sounds/balls_hit.mp3');
		loader.add('border_hit',git_src+'sounds/border_hit.mp3');
		loader.add('ball_potted',git_src+'sounds/ball_potted.mp3');
		loader.add('locked',git_src+'sounds/locked.mp3');
		loader.add('note1',git_src+'sounds/note1.mp3');
		loader.add('sp_win',git_src+'sounds/sp_win.mp3');
		loader.add('sp_start',git_src+'sounds/sp_start.mp3');
		loader.add('lose',git_src+'sounds/lose.mp3');
		loader.add('online_message',git_src+'sounds/online_message.mp3');
		loader.add('receive_sticker',git_src+'sounds/receive_sticker.mp3');
		loader.add('start2',git_src+'sounds/start2.mp3');
		loader.add('popup',git_src+'sounds/popup.mp3');
		loader.add('ready2',git_src+'sounds/ready2.mp3');
		loader.add('win2',git_src+'sounds/win2.mp3');
		loader.add('keypress',git_src+'sounds/keypress.mp3');
		
		loader.add('board1',git_src+'res/boards/board1.png');
		loader.add('board2',git_src+'res/boards/board2.png');
		loader.add('board3',git_src+'res/boards/board3.png');
		loader.add('board4',git_src+'res/boards/board4.png');
		loader.add('board5',git_src+'res/boards/board5.png');
		loader.add('board6',git_src+'res/boards/board6.png');
		loader.add('board7',git_src+'res/boards/board7.png');
		loader.add('board8',git_src+'res/boards/board8.png');
		loader.add('board9',git_src+'res/boards/board9.png');
		loader.add('board10',git_src+'res/boards/board10.png');
		
		//loader.add('lobby_bcg',git_src+'res/common/lobby_bcg_img.jpg');
		//loader.add('main_bcg',git_src+'res/common/main_bcg_img.jpg');
		
		//добавляем библиотеку аватаров
		loader.add('multiavatar', 'https://akukamil.github.io/common/multiavatar.min.txt');	
		
		//уровни для одиночной игры
		loader.add('levels_data', 'levels_data.txt');	
			
		loader.add('music',git_src+'sounds/music.mp3');	
			
		for (let i=0;i<ball_class.BALL_ANIM_FRAMES;i++)
			 loader.add('ball_anim'+i, git_src+'ball_anim/'+ String(i).padStart(4, '0')+'.png');							
		//прогресс
		loader.onProgress.add((l,res)=>{
			this.load_bar_mask.width =410*l.progress*0.01;
			this.t_progress.text=Math.round(l.progress)+'%';
			});		
						
		//ждем загрузки
		await new Promise(res=>loader.load(res))					
						
			
		//переносим все в ассеты
		await new Promise(res=>loader.load(res))
		for (const res_name in loader.resources){
			const res=loader.resources[res_name];			
			assets[res_name]=res.texture||res.sound||res.data;			
		}
		

		//добавялем библиотеку аватаров
		const script = document.createElement('script');
		script.textContent = assets.multiavatar;
		document.head.appendChild(script);
				
		await anim3.add(objects.load_cont,{alpha:[1,0,'linear'],scale_xy:[1,3,'linear'],angle:[0,-30,'linear']}, false, 0.25);

		//информация об уровнях онлайн игры
		sp_game.levels_data=eval(assets.levels_data);
		
		
		objects.bcg=new PIXI.Sprite();
		objects.bcg.x=-10;
		objects.bcg.y=-10;
		objects.bcg.width=M_WIDTH+20;
		objects.bcg.height=M_HEIGHT+20;
		app.stage.addChild(objects.bcg);
		
		
		//создаем спрайты и массивы спрайтов и запускаем первую часть кода
		const main_load_list=eval(assets.main_load_list);
		for (var i = 0; i < main_load_list.length; i++) {
			const obj_class = main_load_list[i].class;
			const obj_name = main_load_list[i].name;
			console.log('Processing: ' + obj_name)

			switch (obj_class) {
			case "sprite":
				objects[obj_name] = new PIXI.Sprite(assets[obj_name]);
				eval(main_load_list[i].code0);
				break;

			case "block":
				eval(main_load_list[i].code0);
				break;

			case "cont":
				eval(main_load_list[i].code0);
				break;

			case "array":
				var a_size=main_load_list[i].size;
				objects[obj_name]=[];
				for (var n=0;n<a_size;n++)
					eval(main_load_list[i].code0);
				break;
			}
		}

		//обрабатываем вторую часть кода в объектах
		for (var i = 0; i < main_load_list.length; i++) {
			const obj_class = main_load_list[i].class;
			const obj_name = main_load_list[i].name;
			console.log('Processing: ' + obj_name)
			
			
			switch (obj_class) {
			case "sprite":
				eval(main_load_list[i].code1);
				break;

			case "block":
				eval(main_load_list[i].code1);
				break;

			case "cont":	
				eval(main_load_list[i].code1);
				break;

			case "array":
				var a_size=main_load_list[i].size;
					for (var n=0;n<a_size;n++)
						eval(main_load_list[i].code1);	;
				break;
			}
		}
		
		
	}	

}

language_dialog = {
	
	p_resolve : {},	
	show () {				
		return new Promise(function(resolve, reject){
			document.body.innerHTML='<style>html,body {margin: 0;padding: 0;height: 100%;}body {display: flex;align-items: center;justify-content: center;background-color: rgba(24,24,44,1);flex-direction: column}.two_buttons_area {  width: 70%;  height: 50%;  margin: 20px 20px 0px 20px;  display: flex;  flex-direction: row;}.button {margin: 5px 5px 5px 5px;width: 50%;height: 100%;color:white;display: block;background-color: rgba(44,55,60,1);font-size: 10vw;padding: 0px;}  #m_progress {  background: rgba(11,255,255,0.1);  justify-content: flex-start;  border-radius: 100px;  align-items: center;  position: relative;  padding: 0 5px;  display: none;  height: 50px;  width: 70%;}#m_bar {  box-shadow: 0 10px 40px -10px #fff;  border-radius: 100px;  background: #fff;  height: 70%;  width: 0%;}</style><div id ="two_buttons" class="two_buttons_area"><button class="button" id ="but_ref1" onclick="language_dialog.p_resolve(0)">RUS</button><button class="button" id ="but_ref2"  onclick="language_dialog.p_resolve(1)">ENG</button></div><div id="m_progress">  <div id="m_bar"></div></div>';
			language_dialog.p_resolve = resolve;						
		})		
	}	
	
}

tabvis={
	
	inactive_timer:0,
	sleep:0,
	invis_timer:0,
	
	change(){
		
		if (document.hidden){
			
			PIXI.sound.volumeAll=0;
			this.inactive_timer=setTimeout(()=>{this.send_to_sleep()},120000);
			this.invis_timer=setInterval(()=>{				
				tabvis.process();	
			},16);
			
		}else{
			clearInterval(this.invis_timer);
			PIXI.sound.volumeAll=1;	
			if(this.sleep){		
				console.log('Проснулись');
				my_ws.reconnect('wakeup');;
				this.sleep=0;
			}
			clearTimeout(this.inactive_timer);			
		}		
		
		set_state({hidden : document.hidden});
		
	},
	
	send_to_sleep(){		
		
		console.log('погрузились в сон')
		this.sleep=1;
		if (lobby.on){
			lobby.close()
			main_menu.activate();				
		}		
		my_ws.send_to_sleep();		
	},
	
	start_hid_process(){
		
		this.invis_timer=setInterval(()=>{				
			tabvis.process();	
		},16);
	
	},
	
	process(){
		
		//if (!common.move_on) return;
		for (let key in some_process)
			some_process[key]();
		anim3.process();
		
	}
}

async function define_platform_and_language() {
	
	const s = window.location.href;
	
	if (s.includes('yandex')) {		
		game_platform = 'YANDEX';		
		if (s.match(/yandex\.ru|yandex\.by|yandex\.kg|yandex\.kz|yandex\.tj|yandex\.ua|yandex\.uz/))
			LANG = 0;
		else 
			LANG = 1;		
		return;
	}
	
	if (s.includes('vk.com')||s.includes('vk_app_id')) {
		game_platform = 'VK';	
		LANG = 0;	
		return;
	}
			
	if (s.includes('google_play')) {
			
		game_platform = 'GOOGLE_PLAY';	
		LANG = await language_dialog.show();
		return;
	}	

	if (s.includes('my_games')) {
			
		game_platform = 'MY_GAMES';	
		LANG = 0;
		return;	
	}	
	
	if (s.includes('crazygames')) {
			
		game_platform = 'CRAZYGAMES';	
		LANG = 1;
		return;
	}
	
	if (s.includes('127.0')) {
			
		game_platform = 'DEBUG';	
		LANG = await language_dialog.show();
		return;	
	}	
	
	game_platform = 'UNKNOWN';	
	LANG = 0//await language_dialog.show();
		

}

async function init_game_env(lang) {			
						
	await define_platform_and_language();
			
	//инициируем файербейс
	if (!firebase.apps.length) {
		firebase.initializeApp({
			apiKey: "AIzaSyDpyFhFCM2Wv7y9e6LycQTIkWl8RreNHI0",
			authDomain: "pool-f7e49.firebaseapp.com",
			databaseURL: "https://pool-f7e49-default-rtdb.europe-west1.firebasedatabase.app",
			projectId: "pool-f7e49",
			storageBucket: "pool-f7e49.appspot.com",
			messagingSenderId: "127048378193",
			appId: "1:127048378193:web:f06d24482d6a32a0d41570"
		});
		
		//коротко файрбейс
		fbs=firebase.database();
	}

	//создаем приложение пикси
	document.body.innerHTML='<style>html,body {margin: 0;padding: 0;height: 100%;}body {display: flex;align-items:center;justify-content: center;background-color: rgba(67,68,72,1)}</style>';
	app = new PIXI.Application({width:M_WIDTH, height:M_HEIGHT,antialias:false,backgroundColor : 0x2B4B58});
	const c=document.body.appendChild(app.view);
	c.style['boxShadow'] = '0 0 15px #000000';
	
	//доп функция для текста битмап
	PIXI.BitmapText.prototype.set2=function(text,w){		
		const t=this.text=text;
		for (i=t.length;i>=0;i--){
			this.text=t.substring(0,i)
			if (this.width<w) return;
		}	
	}

	//доп функция для применения текстуры к графу
	PIXI.Graphics.prototype.set_texture=function(texture){		
	
		if(!texture) return;
		// Get the texture's original dimensions
		const textureWidth = texture.baseTexture.width;
		const textureHeight = texture.baseTexture.height;

		// Calculate the scale to fit the texture to the circle's size
		const scaleX = this.w / textureWidth;
		const scaleY = this.h / textureHeight;

		// Create a new matrix for the texture
		const matrix = new PIXI.Matrix();

		// Scale and translate the matrix to fit the circle
		matrix.scale(scaleX, scaleY);
		const radius=this.w*0.5;
		this.clear();
		this.beginTextureFill({texture,matrix});		
		this.drawCircle(radius, radius, radius);		
		this.endFill();	
	}
	
	//события изменения окна
	resize();
	window.addEventListener('resize', resize);
	
	
	//запускаем главный цикл
	main_loop();
	
	//идентификация
	await auth2.init();	
	
	await main_loader.load1();	
	await main_loader.load2();		

	anim3.add(objects.id_cont,{alpha:[0,1,'linear'],y:[-200,objects.id_cont.sy,'easeOutBack']}, true,0.5);
	some_process.loup_anim=()=>{objects.id_gear.rotation+=0.02}

	//загрузка сокета
	await auth2.load_script('https://akukamil.github.io/common/my_ws.js');	

	//загружаем остальные данные из файербейса
	const other_data = await fbs_once('players/' + my_data.uid)
	if(!other_data) lobby.first_run=1;

	//сервисное сообщение
	if(other_data && other_data.s_msg){
		message.add(other_data.s_msg);
		fbs.ref('players/'+my_data.uid+'/s_msg').remove();
	}

	my_data.rating = 1400;//(other_data?.rating) || 1400;
	my_data.games = (other_data?.games) || 0;
	my_data.name = (other_data?.name)||my_data.name;
	my_data.country = other_data?.country || await auth2.get_country_code() || await auth2.get_country_code2();
	my_data.nick_tm = other_data?.nick_tm || 0;
	my_data.avatar_tm = other_data?.avatar_tm || 0;
	
	//из локального хранилища
	my_data.board_id = safe_ls('pool_board_id')||1;
	my_data.cue_id = safe_ls('pool_cue_id')||1;
	my_data.cue_resource = safe_ls('pool_cue_data')||[9,100,0,0,0,0,0,0];
		
	//правильно определяем аватарку
	if (other_data?.pic_url && other_data.pic_url.includes('mavatar'))
		my_data.pic_url=other_data.pic_url
	else
		my_data.pic_url=my_data.orig_pic_url
	
	//добавляем страну к имени если ее нет
	if (!auth2.get_country_from_name(my_data.name)&&my_data.country)
		my_data.name=`${my_data.name} (${my_data.country})`	
	
	//загружаем мои данные в кэш
	await players_cache.update(my_data.uid,{pic_url:my_data.pic_url,country:my_data.country,name:my_data.name,rating:my_data.rating});
	await players_cache.update_avatar(my_data.uid)

	//устанавливаем данные в попап
	objects.id_avatar.set_texture(players_cache.players[my_data.uid].texture);
	objects.id_name.set2(my_data.name,150);	
	objects.id_rating.text=my_data.rating;
	anim3.add(objects.id_name,{alpha:[0,1,'linear']}, true, 0.55);
	anim3.add(objects.id_rating,{alpha:[0,1,'linear']}, true, 0.55);
			
	//обновляем почтовый ящик
	fbs.ref('inbox/'+my_data.uid).set({sender:'-',message:'-',tm:'-',data:9});

	//подписываемся на новые сообщения
	fbs.ref('inbox/'+my_data.uid).on('value', data=>{process_new_message(data.val())});
	
	//обновляем данные в файербейс так как могли поменяться имя или фото
	fbs.ref('players/'+my_data.uid).set({
		name:my_data.name,
		pic_url:my_data.pic_url,
		rating:my_data.rating,
		nick_tm:my_data.nick_tm,
		avatar_tm:my_data.avatar_tm,
		games:my_data.games,
		country:my_data.country||'',
		tm:firebase.database.ServerValue.TIMESTAMP,
		session_start:firebase.database.ServerValue.TIMESTAMP		
	})
	
	//первый вход и начальные бонусы
	if(!other_data?.first_log_tm){
		fbs.ref('players/'+my_data.uid+'/first_log_tm').set(firebase.database.ServerValue.TIMESTAMP);		
		my_data.cue_resource = [9,100,100,50,10,0,0,0];
		safe_ls('pool_cue_data',my_data.cue_resource);
	}

				
	//номер комнаты
	room_name= 'states1';
		
	//ждем загрузки чата
	await Promise.race([
		chat.init(),
		new Promise(resolve=> setTimeout(() => {console.log('chat is not loaded!');resolve()}, 5000))
	]);
		
	//включаем музыку
	pref.init_music();
		
	//идентификатор клиента
	client_id = irnd(10,999999);	
				
	//устанавливаем мой статус в онлайн
	set_state({state:'o'});
	
	//сообщение для дубликатов
	fbs.ref('inbox/'+my_data.uid).set({message:'CLIEND_ID',tm:Date.now(),client_id});

	//отключение от игры и удаление не нужного
	fbs.ref('inbox/'+my_data.uid).onDisconnect().remove();
	fbs.ref(room_name+'/'+my_data.uid).onDisconnect().remove();
			
	//keep-alive сервис
	setInterval(function()	{keep_alive()}, 40000);

	//убираем попап
	some_process.loup_anim = function(){};
	setTimeout(function(){anim3.add(objects.id_cont,{y:[objects.id_cont.sy, -300,'linear'],x:[objects.id_cont.sx,1200,'linear'],angle:[0,200,'linear']}, false, 0.4)},500);
			
	//это разные события
	document.addEventListener("visibilitychange", function(){tabvis.change()});
	window.addEventListener('wheel', (event) => {	
		//lobby.wheel_event(Math.sign(event.deltaY));
		chat.wheel_event(Math.sign(event.deltaY));
	});	
	window.addEventListener('keydown', function(event) { keyboard.keydown(event.key)});
	

	
	//черный шар
	objects.balls[14].set_color('black');
	
	//белый шар
	objects.balls[15].set_color('white');

	app.stage.interactive=true;
	app.stage.pointerdown=common.pointerdown.bind(common);
	app.stage.pointermove=common.pointermove.bind(common);
	app.stage.pointerup=common.pointerup.bind(common);
	app.stage.pointerout=common.pointerup.bind(common);
	app.stage.pointerupoutside=common.pointerup.bind(common);
		
	//содаем массив со всеми границами доски
	const NUM_OF_BORDERS=6;
	for (let i=0;i<NUM_OF_BORDERS;i++)
		for (let l=0;l<3;l++)			
			all_borders.push(borders[i*4+l]);	
	
	//добавляем границы стола
	let min_x=999999,max_x=-999999,min_y=999999,max_y=-999999;
	all_borders.forEach(b=>{
		min_x=Math.min(min_x,b[0],b[2]);
		min_y=Math.min(min_y,b[1],b[3]);
		max_x=Math.max(max_x,b[0],b[2]);
		max_y=Math.max(max_y,b[1],b[3]);
	})
	
	all_borders.push(
		[min_x,min_y,max_x,min_y],
		[max_x,min_y,max_x,max_y],		
		[max_x,max_y,min_x,max_y],
		[min_x,min_y,min_x,max_y]
	);
		
	main_menu.activate();	
	
	//покупки яндекса
	pref.counume_yndx_purchases();
}

function main_loop() {

	//обрабатываем минипроцессы
	for (let key in some_process)
		some_process[key]();		
	
	game_tick+=0.016666666;
	anim3.process();
	requestAnimationFrame(main_loop);
}




